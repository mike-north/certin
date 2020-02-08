import * as path from "path";
import {
  existsSync as exists,
  readFileSync as read,
  writeFileSync as writeFile
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
import { run, sudo } from "@certin/utils";
import UI from "../user-interface";
import { IPlatform } from "../platforms";
import Workspace from "../workspace";
import { Options } from "@certin/options";
import { paramCase } from "change-case";

const debug = createDebug("certin:platforms:linux");

export default class LinuxPlatform implements IPlatform {
  public constructor(protected workspace: Workspace) {}

  private FIREFOX_NSS_DIR = path.join(HOME, ".mozilla/firefox/*");
  private CHROME_NSS_DIR = path.join(HOME, ".pki/nssdb");
  private FIREFOX_BIN_PATH = "/usr/bin/firefox";
  private CHROME_BIN_PATH = "/usr/bin/google-chrome";

  private HOST_FILE_PATH = "/etc/hosts";

  /**
   * Linux is surprisingly difficult. There seems to be multiple system-wide
   * repositories for certs, so we copy ours to each. However, Firefox does it's
   * usual separate trust store. Plus Chrome relies on the NSS tooling (like
   * Firefox), but uses the user's NSS database, unlike Firefox (which uses a
   * separate Mozilla one). And since Chrome doesn't prompt the user with a GUI
   * flow when opening certs, if we can't use certutil to install our certificate
   * into the user's NSS database, we're out of luck.
   */
  public async addToTrustStores({
    certificatePath,
    appName,
    skipCertutilInstall
  }: {
    appName: string;
    skipCertutilInstall: boolean;
    certificatePath: string;
  }): Promise<void> {
    debug("Adding root CA to Linux system-wide trust stores");
    // run(`sudo cp ${ certificatePath } /etc/ssl/certs/certin.crt`);
    await this.workspace.sudo("cp", [
      `"${certificatePath}"`,
      `/usr/local/share/ca-certificates/${paramCase(appName)}.crt`
    ]);
    // run(`sudo bash -c "cat ${ certificatePath } >> /etc/ssl/certs/ca-certificates.crt"`);
    await this.workspace.sudo(`update-ca-certificates`);

    if (this.isFirefoxInstalled()) {
      // Firefox
      debug(
        "Firefox install detected: adding local root CA to Firefox-specific trust stores ..."
      );
      if (!commandExists("certutil")) {
        if (skipCertutilInstall) {
          debug(
            "NSS tooling is not already installed, and `skipCertutil` is true, so falling back to manual certificate install for Firefox"
          );
          await openCertificateInFirefox(
            this.FIREFOX_BIN_PATH,
            certificatePath
          );
        } else {
          debug(
            "NSS tooling is not already installed. Trying to install NSS tooling now with `apt install`"
          );
          await this.workspace.sudo("apt", ["install", "libnss3-tools"]);
          debug(
            "Installing certificate into Firefox trust stores using NSS tooling"
          );
          await closeFirefox();
          await addCertificateToNSSCertDB(
            this.FIREFOX_NSS_DIR,
            certificatePath,
            "certutil"
          );
        }
      }
    } else {
      debug(
        "Firefox does not appear to be installed, skipping Firefox-specific steps..."
      );
    }

    if (this.isChromeInstalled()) {
      debug(
        "Chrome install detected: adding root CA to Chrome trust store ..."
      );
      if (!commandExists("certutil")) {
        UI.warnChromeOnLinuxWithoutCertutil();
      } else {
        await closeFirefox();
        await addCertificateToNSSCertDB(
          this.CHROME_NSS_DIR,
          certificatePath,
          "certutil"
        );
      }
    } else {
      debug(
        "Chrome does not appear to be installed, skipping Chrome-specific steps..."
      );
    }
  }

  public async removeFromTrustStores({
    certificatePath,
    appName
  }: {
    appName: string;
    certificatePath: string;
  }): Promise<void> {
    try {
      // TODO remove hardcoded path to ca cert
      await this.workspace.sudo("rm", [
        `/usr/local/share/ca-certificates/${paramCase(appName)}.crt`
      ]);
      await this.workspace.sudo(`update-ca-certificates`);
    } catch (e) {
      debug(
        // TODO remove hardcoded path to ca cert
        `failed to remove ${certificatePath} from /usr/local/share/ca-certificates, continuing. ${e.toString()}`
      );
    }
    if (commandExists("certutil")) {
      if (this.isFirefoxInstalled()) {
        await removeCertificateFromNSSCertDB(
          this.FIREFOX_NSS_DIR,
          certificatePath,
          "certutil"
        );
      }
      if (this.isChromeInstalled()) {
        await removeCertificateFromNSSCertDB(
          this.CHROME_NSS_DIR,
          certificatePath,
          "certutil"
        );
      }
    }
  }

  public async addDomainToHostFileIfMissing(domain: string): Promise<void> {
    const hostsFileContents = read(this.HOST_FILE_PATH, "utf8");
    if (!hostsFileContents.includes(domain)) {
      // TODO: can we use sudo() here?
      await run(`echo`, [
        `'127.0.0.1`,
        `${domain}'`,
        `|`,
        `sudo`,
        `tee`,
        `-a`,
        `"${this.HOST_FILE_PATH}"`,
        `>`,
        `/dev/null`
      ]);
    }
  }

  public async deleteProtectedFiles(filepath: string): Promise<void> {
    this.workspace.assertNotTouchingFiles(filepath, "delete");
    try {
      await this.workspace.sudo("rm", [`-rf`, `"${filepath}"`]);
    } catch (e) {
      debug(
        "error while attempting to remove protected file " + filepath + "\n" + e
      );
    }
  }

  public async readProtectedFile(filepath: string): Promise<string | null> {
    this.workspace.assertNotTouchingFiles(filepath, "read");
    const result = await this.workspace.sudo("cat", [`"${filepath}"]`]);
    if (!result) return result;
    return result.toString().trim();
  }

  public async writeProtectedFile(
    filepath: string,
    contents: string
  ): Promise<void> {
    this.workspace.assertNotTouchingFiles(filepath, "write");
    if (exists(filepath)) {
      try {
        await this.workspace.sudo("rm", [`"${filepath}"`]);
      } catch (e) {
        throw new Error(`Problem deleting exisitng file: ${filepath}`);
      }
    }
    writeFile(filepath, contents);
    await this.workspace.sudo("chown", [`0`, `"${filepath}"`]);
    await this.workspace.sudo("chmod", [`600`, `"${filepath}"`]);
  }

  private isFirefoxInstalled(): boolean {
    return exists(this.FIREFOX_BIN_PATH);
  }

  private isChromeInstalled(): boolean {
    return exists(this.CHROME_BIN_PATH);
  }
}
