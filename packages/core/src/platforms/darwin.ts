import * as path from "path";
import {
  writeFileSync as writeFile,
  existsSync as exists,
  readFileSync as read,
  existsSync
} from "fs";
import * as createDebug from "debug";
import { sync as commandExists } from "command-exists";
import {
  addCertificateToNSSCertDB,
  openCertificateInFirefox,
  closeFirefox,
  removeCertificateFromNSSCertDB,
  HOME
} from "./shared";
import { IPlatform } from "../platforms";
import Workspace from "../workspace";
import { Options } from "@certin/options";
import { run } from "@certin/utils";

const debug = createDebug("certin:platforms:macos");

const getCertUtilPath = (): string =>
  path.join(
    run("brew", ["--prefix nss"])
      .toString()
      .trim(),
    "bin",
    "certutil"
  );

export default class MacOSPlatform implements IPlatform {
  public constructor(protected workspace: Workspace) {}
  private FIREFOX_BUNDLE_PATH = "/Applications/Firefox.app";
  private FIREFOX_BIN_PATH = path.join(
    this.FIREFOX_BUNDLE_PATH,
    "Contents/MacOS/firefox"
  );
  private FIREFOX_NSS_DIR = path.join(
    HOME,
    "Library/Application Support/Firefox/Profiles/*"
  );

  private HOST_FILE_PATH = "/etc/hosts";

  /**
   * macOS is pretty simple - just add the certificate to the system keychain,
   * and most applications will delegate to that for determining trusted
   * certificates. Firefox, of course, does it's own thing. We can try to
   * automatically install the cert with Firefox if we can use certutil via the
   * `nss` Homebrew package, otherwise we go manual with user-facing prompts.
   */
  public async addToTrustStores(
    certificatePath: string,
    options: Options
  ): Promise<void> {
    // Chrome, Safari, system utils
    debug("Adding root CA to macOS system keychain");
    this.workspace.sudo(`security`, [
      `add-trusted-cert`,
      `-d`,
      `-r`,
      `trustRoot`,
      `-k`,
      `/Library/Keychains/System.keychain`,
      `-p`,
      `ssl`,
      `-p`,
      `basic`,
      `"${certificatePath}"`
    ]);

    if (this.isFirefoxInstalled()) {
      // Try to use certutil to install the cert automatically
      debug("Firefox install detected. Adding root CA to Firefox trust store");
      if (!this.isNSSInstalled()) {
        if (!options.skipCertutilInstall) {
          if (commandExists("brew")) {
            debug(
              `certutil is not already installed, but Homebrew is detected. Trying to install certutil via Homebrew...`
            );
            run("brew", ["install", "nss"]);
          } else {
            debug(
              `Homebrew isn't installed, so we can't try to install certutil. Falling back to manual certificate install`
            );
            return await openCertificateInFirefox(
              this.FIREFOX_BIN_PATH,
              certificatePath
            );
          }
        } else {
          debug(
            `certutil is not already installed, and skipCertutilInstall is true, so we have to fall back to a manual install`
          );
          return await openCertificateInFirefox(
            this.FIREFOX_BIN_PATH,
            certificatePath
          );
        }
      }
      await closeFirefox();
      addCertificateToNSSCertDB(
        this.FIREFOX_NSS_DIR,
        certificatePath,
        getCertUtilPath()
      );
    } else {
      debug(
        "Firefox does not appear to be installed, skipping Firefox-specific steps..."
      );
    }
  }

  public removeFromTrustStores(certificatePath: string): void {
    debug("Removing root CA from macOS system keychain");
    try {
      if (existsSync(certificatePath)) {
        this.workspace.sudo("security", [
          `remove-trusted-cert`,
          `-d`,
          `"${certificatePath}"`
        ]);
      }
    } catch (e) {
      debug(
        `failed to remove ${certificatePath} from macOS cert store, continuing. ${e.toString()}`
      );
    }
    if (this.isFirefoxInstalled() && this.isNSSInstalled()) {
      debug(
        "Firefox install and certutil install detected. Trying to remove root CA from Firefox NSS databases"
      );
      removeCertificateFromNSSCertDB(
        this.FIREFOX_NSS_DIR,
        certificatePath,
        getCertUtilPath()
      );
    }
  }

  public addDomainToHostFileIfMissing(domain: string): void {
    const hostsFileContents = read(this.HOST_FILE_PATH, "utf8");
    if (!hostsFileContents.includes(domain)) {
      // TODO, can we use sudo() for this?
      run("echo", [
        `'\n127.0.0.1`,
        `${domain}'`,
        `|`,
        `sudo`,
        `tee`,
        `-a`,
        `"${this.HOST_FILE_PATH}" > /dev/null`
      ]);
    }
  }

  public deleteProtectedFiles(filepath: string): void {
    this.workspace.assertNotTouchingFiles(filepath, "delete");
    this.workspace.sudo("rm", [`-rf`, `"${filepath}"`]);
  }

  public readProtectedFile(filepath: string): string {
    this.workspace.assertNotTouchingFiles(filepath, "read");
    return this.workspace
      .sudo("cat", [`"${filepath}"`])
      .toString()
      .trim();
  }

  public writeProtectedFile(filepath: string, contents: string): void {
    this.workspace.assertNotTouchingFiles(filepath, "write");
    if (exists(filepath)) {
      this.workspace.sudo("rm", [`"${filepath}"`]);
    }
    writeFile(filepath, contents);
    this.workspace.sudo("chown", [`0`, `"${filepath}"`]);
    this.workspace.sudo("chmod", [`600`, `"${filepath}"`]);
  }

  private isFirefoxInstalled(): boolean {
    return exists(this.FIREFOX_BUNDLE_PATH);
  }

  private isNSSInstalled(): boolean {
    try {
      return run("brew", ["list", "-1"])
        .toString()
        .includes("\nnss\n");
    } catch (e) {
      return false;
    }
  }
}
