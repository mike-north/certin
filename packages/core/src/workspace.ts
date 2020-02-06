import {
  createPopulatedCaCertConfig,
  createPopulatedDomainCertificateConfig,
  createPopulatedDomainSigningRequestConfig,
  Config
} from "@certin/config";
import { ICertinOptionsArg, Options } from "@certin/options";
import * as assert from "assert";
import * as _createDebug from "debug";
import * as eol from "eol";
import {
  existsSync as exists,
  readdirSync as readdir,
  readFileSync as readFile,
  unlinkSync as rm,
  writeFileSync as writeFile
} from "fs";
import * as rimraf from "rimraf";
import { sync as mkdirp } from "mkdirp";

import * as path from "path";
import { IPlatform, IPlatformFactory } from "./platforms";
import {
  IDomainSigningRequestConfig,
  ISystemUserInterface
} from "@certin/types";
import { openssl, mkTmpFile, sudo } from "@certin/utils";
import { generateKey } from "./certificates";

const debug = _createDebug("certin:core:workspace");

/**
 * @internal
 */
class Workspace {
  private readonly opts: Options;
  private readonly cfg: Config;
  protected platform: IPlatform;
  public constructor(opts: ICertinOptionsArg) {
    this.opts = new Options(opts);
    this.cfg = this.opts.toConfig();
    const platformName = process.platform;
    assert(platformName, "platform name is missing");
    debug(`identified current platform name: ${platformName}`);
    const PlatformClass = require(path.join(
      __dirname,
      "platforms",
      platformName
    )).default as IPlatformFactory;
    assert(PlatformClass, "platform class is missing");
    debug(`found platform class ${PlatformClass}`);
    this.platform = new PlatformClass(this);
    assert(this.platform, "platform instance could not be created");
    debug(`instantiated platform helper ${this.platform}`);
  }

  public async ensureReady(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await this.cfg.ensureConfigDirs();
  }

  public get shouldUseHeadlessMode(): boolean {
    return this.opts.shouldUseHeadlessMode;
  }

  public openssl(args: string[]): void {
    openssl(this.cfg.getConfigDir(), args);
  }

  public sudo(cmd: string, args: string[] = []): Promise<string | null> {
    return sudo(this.opts.appName, cmd, args);
  }

  public getOpenSSLCaGenerationCommand(): string[] {
    return [
      "req",
      "-new",
      "-x509",
      "-config",
      `"${this.cfg.getCaSelfSignConfig()}"`,
      "-key",
      `"${this.cfg.getRootCAKeyPath()}"`,
      "-out",
      `"${this.cfg.getRootCACertPath()}"`,
      "-days",
      `${this.opts.ca.defaultDays}`
    ];
  }
  public getOpenSSLCaErrors(): string {
    try {
      this.openssl([
        `x509`,
        `-in`,
        `"${this.cfg.getRootCACertPath()}"`,
        `-noout`
      ]);
      return "";
    } catch (e) {
      return e.toString();
    }
  }

  /**
   * Smoothly migrate the certificate storage from v1.0.x to >= v1.1.0.
   * In v1.1.0 there are new options for retrieving the CA cert directly,
   * to help third-party Node apps trust the root CA.
   *
   * If a v1.0.x cert already exists, then we have written it with
   * platform.writeProtectedFile(), so an unprivileged readFile cannot access it.
   * Pre-detect and remedy this; it should only happen once per installation.
   *
   * @internal
   */
  public async ensureCACertReadable(workspace: Workspace): Promise<void> {
    if (!this.getOpenSSLCaErrors()) {
      return;
    }
    /**
     * on windows, writeProtectedFile left the cert encrypted on *nix, the cert
     * has no read permissions either way, openssl will fail and that means we
     * have to fix it
     */
    try {
      const caFileContents = await this.platform.readProtectedFile(
        this.cfg.getRootCACertPath()
      );
      this.platform.deleteProtectedFiles(this.cfg.getRootCACertPath());
      writeFile(this.cfg.getRootCACertPath(), caFileContents);
    } catch (e) {
      return this.installCertificateAuthority();
    }

    // double check that we have a live one
    const remainingErrors = this.getOpenSSLCaErrors();
    if (remainingErrors) {
      return this.installCertificateAuthority();
    }
  }

  /**
   * Install the once-per-machine trusted root CA. We'll use this CA to sign
   * per-app certs.
   *
   * @internal
   */
  public async installCertificateAuthority(): Promise<void> {
    debug(
      `Uninstalling existing certificates, which will be void once any existing CA is gone`
    );
    this.uninstallCA();
    this.ensureReady();

    debug(`Making a temp working directory for files to copied in`);
    const rootKeyPath = mkTmpFile();

    debug(
      `Generating the OpenSSL configuration needed to setup the certificate authority`
    );
    this.seedConfigFiles();

    debug(`Generating a private key`);
    generateKey(this, this.cfg.getRootCAKeyPath());

    debug(`Generating a CA certificate`);
    this.openssl(this.getOpenSSLCaGenerationCommand());

    debug("Saving certificate authority credentials");
    await this.saveCertificateAuthorityCredentials();

    debug(`Adding the root certificate authority to trust stores`);
    await this.platform.addToTrustStores(this.cfg.getRootCACertPath());
  }

  /**
   *
   * @param commonName - commonName of certificate
   * @internal
   */
  public hasCertificateFor(commonName: string): boolean {
    return exists(this.cfg.getPathForDomain(commonName, `certificate.crt`));
  }
  /**
   *
   * @param commonName - commonName of certificate
   * @internal
   */
  public configuredDomains(): string[] {
    return readdir(this.cfg.getDomainsDir());
  }

  /**
   *
   * @param commonName - commonName of certificate
   * @internal
   */
  public removeDomain(commonName: string): void {
    rimraf.sync(this.cfg.getPathForDomain(commonName));
  }

  /**
   * Initializes the files OpenSSL needs to sign certificates as a certificate
   * authority, as well as our CA setup version
   */
  public seedConfigFiles(): void {
    // This is v2 of the certificate authority setup
    writeFile(this.cfg.getCaVersionFile(), "2");
    // OpenSSL CA files
    writeFile(this.cfg.getOpensslDatabaseFilePath(), "");
    writeFile(this.cfg.getOpensslSerialFilePath(), "01");
  }

  public async saveCertificateAuthorityCredentials(): Promise<void> {
    debug(`Saving certificate authority credentials`);
    const key = readFile(this.cfg.getRootCAKeyPath(), "utf-8");
    await this.platform.writeProtectedFile(this.cfg.getRootCAKeyPath(), key);
  }

  public assertNotTouchingFiles(filepath: string, operation: string): void {
    if (!filepath.startsWith(this.cfg.getConfigDir())) {
      throw new Error(
        `Cannot ${operation} ${filepath}; it is outside known certin config directories!`
      );
    }
  }

  /**
   * Remove as much of this libary's files and state as we can. This is necessary
   * when generating a new root certificate, and should be available to API
   * consumers as well.
   *
   * Not all of it will be removable. If certutil is not installed, we'll leave
   * Firefox alone. We try to remove files with maximum permissions, and if that
   * fails, we'll silently fail.
   *
   * It's also possible that the command to untrust will not work, and we'll
   * silently fail that as well; with no existing certificates anymore, the
   * security exposure there is minimal.
   *
   * @alpha
   */
  public uninstallCA(): void {
    this.platform.removeFromTrustStores(this.cfg.getRootCACertPath());
    this.platform.deleteProtectedFiles(this.cfg.getDomainsDir());
    this.platform.deleteProtectedFiles(this.cfg.getRootCADir());
    this.platform.deleteProtectedFiles(this.cfg.getConfigDir());
  }

  public withCertAuthorityConfig(cb: (filepath: string) => void): void {
    const { name: tmpFile } = mkTmpFile();
    const result = createPopulatedCaCertConfig(this.cfg.getCAParams());
    writeFile(tmpFile, eol.auto(result));
    cb(tmpFile);
    rm(tmpFile);
  }

  public getKeyPathForDomain(commonName: string): string {
    return this.cfg.getPathForDomain(commonName, `private-key.key`);
  }
  public ensureDomainPathExists(commonName: string): void {
    mkdirp(this.cfg.getPathForDomain(commonName));
  }
  public getCertPathForDomain(commonName: string): string {
    return this.cfg.getPathForDomain(commonName, `certificate.crt`);
  }
  public getCsrPathForDomain(commonName: string): string {
    return this.cfg.getPathForDomain(
      commonName,
      `certificate-signing-request.csr`
    );
  }
  public domainCertExists(commonName: string): boolean {
    return exists(this.getCertPathForDomain(commonName));
  }
  public isRootCaInstalled(): boolean {
    return !exists(this.cfg.getRootCAKeyPath());
  }
  public get isForceModeEnabled(): boolean {
    return this.opts.isForceModeEnabled;
  }
  public get isSilentModeEnabled(): boolean {
    return this.opts.isSilentModeEnabled;
  }
  public get isInteractiveModeEnabled(): boolean {
    return this.opts.isSilentModeEnabled;
  }

  public get shouldSkipCertutilInstall(): boolean {
    return this.opts.skipCertutilInstall;
  }
  public get shouldSkipHostsFile(): boolean {
    return this.opts.skipHostsFile;
  }
  public get ui(): ISystemUserInterface {
    return this.ui;
  }

  public withDomainSigningRequestConfig(
    opts: Partial<IDomainSigningRequestConfig>,
    cb: (filepath: string) => void
  ): void {
    const { name: tmpFile } = mkTmpFile();
    const result = createPopulatedDomainSigningRequestConfig({
      ...this.cfg.getDomainCSRParams(),
      ...opts
    });
    writeFile(tmpFile, eol.auto(result));
    cb(tmpFile);
    rm(tmpFile);
  }

  public withDomainCertificateConfig(
    opts: Partial<IDomainSigningRequestConfig>,
    cb: (filepath: string) => void
  ): void {
    const { name: tmpFile } = mkTmpFile();
    const result = createPopulatedDomainCertificateConfig({
      ...this.cfg.getDomainCertParams(),
      ...opts
    });
    writeFile(tmpFile, eol.auto(result));
    cb(tmpFile);
    rm(tmpFile);
  }

  /**
   *
   * @param cb
   * @internal
   */
  public async withCertificateAuthorityCredentials(
    cb: ({
      caKeyPath,
      caCertPath
    }: {
      caKeyPath: string;
      caCertPath: string;
    }) => Promise<void> | void
  ): Promise<void> {
    debug(`Retrieving certificate authority credentials`);
    const { name: tmpCAKeyPath } = mkTmpFile();
    const caKey = await this.platform.readProtectedFile(
      this.cfg.getRootCAKeyPath()
    );
    writeFile(tmpCAKeyPath, caKey);
    await cb({
      caKeyPath: tmpCAKeyPath,
      caCertPath: this.cfg.getRootCACertPath()
    });
    rm(tmpCAKeyPath);
  }
}

export default Workspace;
