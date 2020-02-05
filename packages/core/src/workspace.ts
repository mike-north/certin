import {
  createConfig,
  createPopulatedCaCertConfig,
  createPopulatedDomainCertificateConfig,
  createPopulatedDomainSigningRequestConfig,
  Config
} from "@certin/config";
import {
  ICertinConfig,
  IPartialCertinConfigOptions,
  ICertinUserFacingOptions,
  IDomainSigningRequestConfigOptions,
  IDomainCertificateConfigOptions
} from "@certin/types";
import { mkTmpFile } from "@certin/utils";
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
import { IPlatform, IPlatformFactory } from "./platforms";

const debug = _createDebug("certin:core:workspace");

/**
 * @internal
 */
class Workspace {
  public readonly cfg: Config;
  public platform: IPlatform;
  public constructor(opts: ICertinUserFacingOptions) {
    this.cfg = createConfig(opts);
    const platformName = process.platform;
    assert(platformName, "platform name is missing");
    debug(`identified current platform name: ${platformName}`);
    const PlatformClass = require(`./${platformName}`)
      .default as IPlatformFactory;
    assert(PlatformClass, "platform class is missing");
    debug(`found platform class ${PlatformClass}`);
    this.platform = new PlatformClass(this);
    assert(this.platform, "platform instance could not be created");
    debug(`instantiated platform helper ${this.platform}`);
  }

  public getOpenSSLCaGenerationCommand(rootKeyPath: string): string {
    return `req -new -x509 -config "${this.cfg.caSelfSignConfig}" -key "${rootKeyPath}" -out "${this.cfg.rootCACertPath}" -days ${this.cfg.options.ca.defaultDays}`;
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
    return readdir(this.cfg.domainsDir);
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
    writeFile(this.cfg.caVersionFile, "2");
    // OpenSSL CA files
    writeFile(this.cfg.opensslDatabaseFilePath, "");
    writeFile(this.cfg.opensslSerialFilePath, "01");
  }

  public async saveCertificateAuthorityCredentials(
    keypath: string
  ): Promise<void> {
    debug(`Saving certificate authority credentials`);
    const key = readFile(keypath, "utf-8");
    await this.platform.writeProtectedFile(this.cfg.rootCAKeyPath, key);
  }

  public assertNotTouchingFiles(filepath: string, operation: string): void {
    if (
      !filepath.startsWith(this.cfg.configDir) &&
      !filepath.startsWith(this.cfg.getConfigDir())
    ) {
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
    this.platform.removeFromTrustStores(this.cfg.rootCACertPath);
    this.platform.deleteProtectedFiles(this.cfg.domainsDir);
    this.platform.deleteProtectedFiles(this.cfg.rootCADir);
    this.platform.deleteProtectedFiles(this.cfg.getConfigDir());
  }

  public withCertAuthorityConfig(cb: (filepath: string) => void): void {
    const { name: tmpFile } = mkTmpFile();
    const result = createPopulatedCaCertConfig(this.cfg.options.ca);
    writeFile(tmpFile, eol.auto(result));
    cb(tmpFile);
    rm(tmpFile);
  }

  public withDomainSigningRequestConfig(
    opts: Partial<IDomainSigningRequestConfigOptions>,
    cb: (filepath: string) => void
  ): void {
    const { name: tmpFile } = mkTmpFile();
    const result = createPopulatedDomainSigningRequestConfig({
      ...this.cfg.options.domainCert,
      ...opts
    });
    writeFile(tmpFile, eol.auto(result));
    cb(tmpFile);
    rm(tmpFile);
  }

  public withDomainCertificateConfig(
    opts: Partial<IDomainSigningRequestConfigOptions>,
    cb: (filepath: string) => void
  ): void {
    const { name: tmpFile } = mkTmpFile();
    this.cfg.options.domainCert;
    const result = createPopulatedDomainCertificateConfig({
      ...this.cfg.options.domainCert,
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
    const caKey = await this.platform.readProtectedFile(this.cfg.rootCAKeyPath);
    writeFile(tmpCAKeyPath, caKey);
    await cb({
      caKeyPath: tmpCAKeyPath,
      caCertPath: this.cfg.rootCACertPath
    });
    rm(tmpCAKeyPath);
  }
}

export default Workspace;
