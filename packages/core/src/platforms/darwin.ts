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

const getCertUtilPath = async (): Promise<string> =>
  path.join(
    (await run("brew", ["--prefix nss"])).toString().trim(),
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
  public async addToTrustStores({
    appName,
    skipCertutilInstall,
    certificatePath
  }: {
    appName: string;
    skipCertutilInstall: boolean;
    certificatePath: string;
  }): Promise<void> {
    // Chrome, Safari, system utils
    debug("Adding root CA to macOS system keychain");
    await this.workspace.sudo(`security`, [
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
      if (!(await this.isNSSInstalled())) {
        if (!skipCertutilInstall) {
          if (commandExists("brew")) {
            debug(
              `certutil is not already installed, but Homebrew is detected. Trying to install certutil via Homebrew...`
            );
            await run("brew", ["install", "nss"]);
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
      await addCertificateToNSSCertDB(
        this.FIREFOX_NSS_DIR,
        certificatePath,
        await getCertUtilPath()
      );
    } else {
      debug(
        "Firefox does not appear to be installed, skipping Firefox-specific steps..."
      );
    }
  }

  public async removeFromTrustStores({
    certificatePath
  }: {
    appName: string;
    certificatePath: string;
  }): Promise<void> {
    debug("Removing root CA from macOS system keychain");
    try {
      if (existsSync(certificatePath)) {
        await this.workspace.sudo("security", [
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
    if (this.isFirefoxInstalled() && (await this.isNSSInstalled())) {
      debug(
        "Firefox install and certutil install detected. Trying to remove root CA from Firefox NSS databases"
      );
      await removeCertificateFromNSSCertDB(
        this.FIREFOX_NSS_DIR,
        certificatePath,
        await getCertUtilPath()
      );
    }
  }

  public async addDomainToHostFileIfMissing(domain: string): Promise<void> {
    const hostsFileContents = read(this.HOST_FILE_PATH, "utf8");
    if (!hostsFileContents.includes(domain)) {
      // TODO, can we use sudo() for this?
      await run("echo", [
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

  public async deleteProtectedFiles(filepath: string): Promise<void> {
    this.workspace.assertNotTouchingFiles(filepath, "delete");
    await this.workspace.sudo("rm", [`-rf`, `"${filepath}"`]);
  }

  public async readProtectedFile(filepath: string): Promise<string | null> {
    this.workspace.assertNotTouchingFiles(filepath, "read");
    const result = await this.workspace.sudo("cat", [`"${filepath}"`]);
    if (!result) return result;
    return result.toString().trim();
  }

  public async writeProtectedFile(
    filepath: string,
    contents: string
  ): Promise<void> {
    this.workspace.assertNotTouchingFiles(filepath, "write");
    if (exists(filepath)) {
      await this.workspace.sudo("rm", [`"${filepath}"`]);
    }
    writeFile(filepath, contents);
    await this.workspace.sudo("chown", [`0`, `"${filepath}"`]);
    await this.workspace.sudo("chmod", [`600`, `"${filepath}"`]);
  }

  private isFirefoxInstalled(): boolean {
    return exists(this.FIREFOX_BUNDLE_PATH);
  }

  private async isNSSInstalled(): Promise<boolean> {
    try {
      const result = await run("brew", ["list", "-1"]);
      return result.toString().includes("\nnss\n");
    } catch (e) {
      return false;
    }
  }
}
