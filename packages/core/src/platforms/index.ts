import Workspace from "../workspace";
import { Options } from "@certin/options";

export interface IPlatformFactory {
  new (workspace: Workspace): IPlatform;
}
export interface IPlatform {
  addToTrustStores(arg: {
    appName: string;
    skipCertutilInstall: boolean;
    certificatePath: string;
  }): void | Promise<void>;
  removeFromTrustStores(arg: {
    appName: string;
    certificatePath: string;
  }): Promise<void>;
  addDomainToHostFileIfMissing(domain: string): Promise<void>;
  deleteProtectedFiles(filepath: string): Promise<void>;
  readProtectedFile(filepath: string): string | Promise<string | null>;
  writeProtectedFile(filepath: string, contents: string): Promise<void>;
}

const PlatformClass = require(`./${process.platform}`).default;
export default new PlatformClass() as IPlatform;
