import applicationConfigPath = require("application-config-path");
import { isLinux, isWindows } from "@certin/utils";
import { sync as mkdirp } from "mkdirp";
import * as path from "path";
import {
  ICACertConfig,
  IDomainCertificateConfig,
  IDomainSigningRequestConfig
} from "@certin/types";

/**
 * @internal
 */
export interface IConfigArg {
  appName: string;
}

/**
 * @internal
 */
class CertinConfig {
  private configDir: string;
  private appName: string;
  public constructor(arg: IConfigArg) {
    this.appName = arg.appName;
    this.configDir = applicationConfigPath(this.appName);
  }
  public getCaVersionFile(): string {
    return this.getConfigPath(this.appName + "-ca-version");
  }
  public getOpensslSerialFilePath(): string {
    return this.getConfigPath("certificate-authority", "serial");
  }
  public getOpensslDatabaseFilePath(): string {
    return this.getConfigPath("certificate-authority", "index.txt");
  }
  public getOpenSSLConfigPath(): string {
    return path.join(__dirname, "../openssl-configurations");
  }
  public getCaSelfSignConfig(): string {
    return this.getPathForOpenSSLConfig(
      "certificate-authority-self-signing.conf"
    );
  }
  public getDomainCsrConfig(): string {
    return this.getPathForOpenSSLConfig(
      "domain-certificate-signing-requests.conf"
    );
  }
  public getDomainCertConfig(): string {
    return this.getPathForOpenSSLConfig("domain-certificates.conf");
  }
  public getRootCADir(): string {
    return this.getConfigPath("certificate-authority");
  }
  public getRootCAKeyPath(): string {
    return this.getConfigPath("certificate-authority", "private-key.key");
  }
  public getRootCACertPath(): string {
    return this.getConfigPath("certificate-authority", "certificate.cert");
  }
  public getConfigPath(...pathSegments: string[]): string {
    return path.join(this.configDir, ...pathSegments);
  }
  public getDomainsDir(): string {
    return this.getConfigPath("domains");
  }
  public getPathForDomain(domain: string, ...pathSegments: string[]): string {
    return this.getPathForDomain(domain, ...pathSegments);
  }
  public getPathForOpenSSLConfig(...pathSegments: string[]): string {
    return path.join(this.getOpenSSLConfigPath(), ...pathSegments);
  }

  public getCAParams(): ICACertConfig {
    return {} as any;
  }
  public getDomainCSRParams(): IDomainSigningRequestConfig {
    return {} as any;
  }
  public getDomainCertParams(): IDomainCertificateConfig {
    return {} as any;
  }

  public ensureConfigDirs(): void {
    mkdirp(this.configDir);
    mkdirp(this.getDomainsDir());
    mkdirp(this.getRootCADir());
  }
  public getConfigDir(): string {
    if (isWindows && process.env.LOCALAPPDATA) {
      return path.join(process.env.LOCALAPPDATA, this.appName, "config");
    } else {
      const uid = process.getuid && process.getuid();
      const userHome =
        isLinux && uid === 0
          ? path.resolve("/usr/local/share")
          : require("os").homedir();
      return path.join(userHome, ".config", this.appName);
    }
  }
}
export default CertinConfig;
