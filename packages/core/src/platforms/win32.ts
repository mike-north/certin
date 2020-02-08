import * as createDebug from "debug";
import * as crypto from "crypto";
import { writeFileSync as write, readFileSync as read } from "fs";
import { sync as rimraf } from "rimraf";
import { openCertificateInFirefox } from "./shared";
import { IPlatform } from "../platforms";
import UI from "../user-interface";
import Workspace from "../workspace";
import { Options } from "@certin/options";
import { run } from "@certin/utils";

const debug = createDebug("certin:platforms:windows");

let encryptionKey: string | null;

export default class WindowsPlatform implements IPlatform {
  public constructor(protected workspace: Workspace) {}

  private HOST_FILE_PATH = "C:\\Windows\\System32\\Drivers\\etc\\hosts";

  /**
   * Windows is at least simple. Like macOS, most applications will delegate to
   * the system trust store, which is updated with the confusingly named
   * `certutil` exe (not the same as the NSS/Mozilla certutil). Firefox does it's
   * own thing as usual, and getting a copy of NSS certutil onto the Windows
   * machine to try updating the Firefox store is basically a nightmare, so we
   * don't even try it - we just bail out to the GUI.
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
    // IE, Chrome, system utils
    debug("adding root to Windows OS trust store");
    try {
      run("certutil", [`-addstore`, `-user`, `root`, `"${certificatePath}"`]);
    } catch (e) {
      e.output.map((buffer: Buffer) => {
        if (buffer) {
          console.log(buffer.toString());
        }
      });
    }
    debug("adding root to Firefox trust store");
    // Firefox (don't even try NSS certutil, no easy install for Windows)
    try {
      await openCertificateInFirefox("start firefox", certificatePath);
    } catch {
      debug("Error opening Firefox, most likely Firefox is not installed");
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async removeFromTrustStores({
    appName,
    certificatePath
  }: {
    appName: string;
    certificatePath: string;
  }): Promise<void> {
    debug("removing root from Windows OS trust store");
    try {
      console.warn(
        "Removing old certificates from trust stores. You may be prompted to grant permission for this. It's safe to delete old certificates."
      );
      // TODO: remove hardcoded cert label
      run("certutil", [`-delstore`, `-user`, `root`, `certin`]);
    } catch (e) {
      debug(
        `failed to remove ${certificatePath} from Windows OS trust store, continuing. ${e.toString()}`
      );
    }
  }

  public async addDomainToHostFileIfMissing(domain: string): Promise<void> {
    const hostsFileContents = read(this.HOST_FILE_PATH, "utf8");
    if (!hostsFileContents.includes(domain)) {
      await this.workspace.sudo("echo", [
        `127.0.0.1`,
        domain,
        `>>`,
        this.HOST_FILE_PATH
      ]);
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async deleteProtectedFiles(filepath: string): Promise<void> {
    this.workspace.assertNotTouchingFiles(filepath, "delete");
    rimraf(filepath);
  }

  public async readProtectedFile(filepath: string): Promise<string> {
    this.workspace.assertNotTouchingFiles(filepath, "read");
    if (!encryptionKey) {
      encryptionKey = await UI.getWindowsEncryptionPassword();
    }
    // Try to decrypt the file
    try {
      return this.decrypt(read(filepath, "utf8"), encryptionKey);
    } catch (e) {
      // If it's a bad password, clear the cached copy and retry
      if (e.message.indexOf("bad decrypt") >= -1) {
        encryptionKey = null;
        return await this.readProtectedFile(filepath);
      }
      throw e;
    }
  }

  public async writeProtectedFile(
    filepath: string,
    contents: string
  ): Promise<void> {
    this.workspace.assertNotTouchingFiles(filepath, "write");
    if (!encryptionKey) {
      encryptionKey = await UI.getWindowsEncryptionPassword();
    }
    const encryptedContents = this.encrypt(contents, encryptionKey);
    write(filepath, encryptedContents);
  }

  private encrypt(text: string, key: string): string {
    const cipher = crypto.createCipher("aes256", new Buffer(key));
    return cipher.update(text, "utf8", "hex") + cipher.final("hex");
  }

  private decrypt(encrypted: string, key: string): string {
    const decipher = crypto.createDecipher("aes256", new Buffer(key));
    return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
  }
}
