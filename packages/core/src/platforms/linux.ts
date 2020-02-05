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
import { run } from "../utils";
import { IOptions } from "../legacy";
import UI from "../user-interface";
import { IPlatform } from "../platforms";
import Workspace from "../workspace";

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
  public async addToTrustStores(
    certificatePath: string,
    options: IOptions = {}
  ): Promise<void> {
    debug("Adding root CA to Linux system-wide trust stores");
    // run(`sudo cp ${ certificatePath } /etc/ssl/certs/certin.crt`);
    run(
      `sudo cp "${certificatePath}" /usr/local/share/ca-certificates/certin.crt`
    );
    // run(`sudo bash -c "cat ${ certificatePath } >> /etc/ssl/certs/ca-certificates.crt"`);
    run(`sudo update-ca-certificates`);

    if (this.isFirefoxInstalled()) {
      // Firefox
      debug(
        "Firefox install detected: adding local root CA to Firefox-specific trust stores ..."
      );
      if (!commandExists("certutil")) {
        if (options.skipCertutilInstall) {
          debug(
            "NSS tooling is not already installed, and `skipCertutil` is true, so falling back to manual certificate install for Firefox"
          );
          openCertificateInFirefox(this.FIREFOX_BIN_PATH, certificatePath);
        } else {
          debug(
            "NSS tooling is not already installed. Trying to install NSS tooling now with `apt install`"
          );
          run("sudo apt install libnss3-tools");
          debug(
            "Installing certificate into Firefox trust stores using NSS tooling"
          );
          await closeFirefox();
          addCertificateToNSSCertDB(
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
        addCertificateToNSSCertDB(
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

  public removeFromTrustStores(certificatePath: string): void {
    try {
      run(`sudo rm /usr/local/share/ca-certificates/certin.crt`);
      run(`sudo update-ca-certificates`);
    } catch (e) {
      debug(
        `failed to remove ${certificatePath} from /usr/local/share/ca-certificates, continuing. ${e.toString()}`
      );
    }
    if (commandExists("certutil")) {
      if (this.isFirefoxInstalled()) {
        removeCertificateFromNSSCertDB(
          this.FIREFOX_NSS_DIR,
          certificatePath,
          "certutil"
        );
      }
      if (this.isChromeInstalled()) {
        removeCertificateFromNSSCertDB(
          this.CHROME_NSS_DIR,
          certificatePath,
          "certutil"
        );
      }
    }
  }

  public addDomainToHostFileIfMissing(domain: string): void {
    const hostsFileContents = read(this.HOST_FILE_PATH, "utf8");
    if (!hostsFileContents.includes(domain)) {
      run(
        `echo '127.0.0.1  ${domain}' | sudo tee -a "${this.HOST_FILE_PATH}" > /dev/null`
      );
    }
  }

  public deleteProtectedFiles(filepath: string): void {
    this.workspace.assertNotTouchingFiles(filepath, "delete");
    run(`sudo rm -rf "${filepath}"`);
  }

  public readProtectedFile(filepath: string): string {
    this.workspace.assertNotTouchingFiles(filepath, "read");
    return run(`sudo cat "${filepath}"`)
      .toString()
      .trim();
  }

  public writeProtectedFile(filepath: string, contents: string): void {
    this.workspace.assertNotTouchingFiles(filepath, "write");
    if (exists(filepath)) {
      run(`sudo rm "${filepath}"`);
    }
    writeFile(filepath, contents);
    run(`sudo chown 0 "${filepath}"`);
    run(`sudo chmod 600 "${filepath}"`);
  }

  private isFirefoxInstalled(): boolean {
    return exists(this.FIREFOX_BIN_PATH);
  }

  private isChromeInstalled(): boolean {
    return exists(this.CHROME_BIN_PATH);
  }
}
