import applicationConfigPath = require("application-config-path");
import * as path from "path";
import { sync as mkdirp } from "mkdirp";
import { isWindows, isLinux } from "@certin/utils";
import {
  ICertinConfig,
  ICertinConfigOptions,
  IPartialCertinConfigOptions,
  ICertinConfigUxOptions,
  IDomainCertificateConfigOptions,
  ICACertConfigOptions,
  IDomainSigningRequestConfigOptions,
  ICertinUserFacingOptions
} from "@certin/types";
import { ExtractPropertyNamesOfType } from "@mike-north/types";

const UX_CONFIG_DEFAULTS: ICertinConfigUxOptions = {
  appName: "cert-in",
  interactiveMode: false,
  forceMode: false,
  silentMode: false
};

/**
 * @internal
 */
export const DEFAULT_CA_CERT_OPTIONS: ICACertConfigOptions = {
  defaultDays: 90,
  name: "certin"
};

/**
 * @internal
 */
export const DEFAULT_DOMAIN_CSR_OPTIONS: Pick<
  IDomainSigningRequestConfigOptions,
  "subjectAltNames"
> = {
  subjectAltNames: []
};

/**
 * @internal
 */
export const DEFAULT_DOMAIN_CERT_OPTIONS: Pick<
  IDomainCertificateConfigOptions,
  "defaultDays" | "defaultCa" | "subjectAltNames" | "signWithDevCa"
> = {
  defaultDays: 30,
  signWithDevCa: true,
  subjectAltNames: [],
  defaultCa: "certin"
};

function getConfigPath(appName: string, ...pathSegments: string[]): string {
  const configDir = applicationConfigPath(appName);
  return path.join(configDir, ...pathSegments);
}

function getSerialFilePath(appName: string): string {
  return getConfigPath(appName, "certificate-authority", "serial");
}
function getDatabaseFilePath(appName: string): string {
  return getConfigPath(appName, "certificate-authority", "index.txt");
}
function getDomainsDir(appName: string): string {
  return getConfigPath(appName, "domains");
}
function getPathForDomain(
  appName: string,
  domain: string,
  ...pathSegments: string[]
): string {
  return path.join(getDomainsDir(appName), ...pathSegments);
}

function randString(): string {
  return Math.round(Math.random() * 12.34e20).toString(31);
}

function convertFromUserFacingOptions(
  opts: ICertinUserFacingOptions
): IPartialCertinConfigOptions & {
  domainCert: {
    commonName: string;
    serial: string;
    database: string;
    newCertsDir: string;
  };
  domainCsr: { commonName: string };
} {
  const appName = (opts.ux || {}).appName ?? UX_CONFIG_DEFAULTS.appName;
  const commonName =
    (opts.domainCert ?? {}).commonName || `${randString()}.example.com`;
  return {
    domainCert: {
      commonName,
      serial: getSerialFilePath(appName),
      database: getDatabaseFilePath(appName),
      newCertsDir: getPathForDomain(appName, commonName)
    },
    domainCsr: {
      commonName
    }
  };
}
function reifyOptions(
  inputs: IPartialCertinConfigOptions & {
    domainCert: {
      commonName: string;
      serial: string;
      database: string;
      newCertsDir: string;
    };
    domainCsr: { commonName: string };
  }
): ICertinConfigOptions {
  return {
    ...inputs,
    ux: { ...UX_CONFIG_DEFAULTS, ...(inputs ?? {}).ux },
    ca: { ...DEFAULT_CA_CERT_OPTIONS, ...(inputs ?? {}).ca },
    domainCert: {
      ...DEFAULT_DOMAIN_CERT_OPTIONS,
      ...(inputs ?? {}).domainCert
    },
    domainCsr: { ...DEFAULT_DOMAIN_CSR_OPTIONS, ...(inputs ?? {}).domainCsr }
  };
}

/**
 * @internal
 */
class CertinConfig implements ICertinConfig {
  public options: ICertinConfigOptions;

  public readonly configDir: string;
  public readonly caVersionFile: string;
  public readonly opensslSerialFilePath: string;
  public readonly opensslDatabaseFilePath: string;
  private readonly openSSLConfigPath: string;
  public readonly caSelfSignConfig: string;
  public readonly domainCsrConfig: string;
  public readonly domainCertConfig: string;
  public readonly rootCADir: string;
  public readonly rootCAKeyPath: string;
  public readonly rootCACertPath: string;
  public constructor(options: ICertinUserFacingOptions) {
    this.options = reifyOptions(convertFromUserFacingOptions(options));
    this.configDir = applicationConfigPath(this.options.ux.appName);
    this.caVersionFile = this.getConfigPath(
      this.options.ux.appName + "-ca-version"
    );
    this.opensslSerialFilePath = this.getConfigPath(
      "certificate-authority",
      "serial"
    );
    this.opensslDatabaseFilePath = this.getConfigPath(
      "certificate-authority",
      "index.txt"
    );
    this.openSSLConfigPath = path.join(
      __dirname,
      "../openssl-configurations" // TODO
    );
    this.caSelfSignConfig = this.getPathForOpenSSLConfig(
      "certificate-authority-self-signing.conf"
    );
    this.domainCsrConfig = this.getPathForOpenSSLConfig(
      "domain-certificate-signing-requests.conf"
    );
    this.domainCertConfig = this.getPathForOpenSSLConfig(
      "domain-certificates.conf"
    );
    this.rootCADir = this.getConfigPath("certificate-authority");
    this.rootCAKeyPath = this.getConfigPath(
      "certificate-authority",
      "private-key.key"
    );
    this.rootCACertPath = this.getConfigPath(
      "certificate-authority",
      "certificate.cert"
    );
  }
  public getConfigPath(...pathSegments: string[]): string {
    return path.join(this.configDir, ...pathSegments);
  }
  public get domainsDir(): string {
    return getDomainsDir(this.options.ux.appName);
  }
  public getPathForDomain(domain: string, ...pathSegments: string[]): string {
    return getPathForDomain(this.options.ux.appName, domain, ...pathSegments);
  }
  public getPathForOpenSSLConfig(...pathSegments: string[]): string {
    return path.join(this.openSSLConfigPath, ...pathSegments);
  }

  public ensureConfigDirs(): void {
    mkdirp(this.configDir);
    mkdirp(this.domainsDir);
    mkdirp(this.rootCADir);
  }
  public getConfigDir(): string {
    if (isWindows && process.env.LOCALAPPDATA) {
      return path.join(
        process.env.LOCALAPPDATA,
        this.options.ux.appName,
        "config"
      );
    } else {
      const uid = process.getuid && process.getuid();
      const userHome =
        isLinux && uid === 0
          ? path.resolve("/usr/local/share")
          : require("os").homedir();
      return path.join(userHome, ".config", this.options.ux.appName);
    }
  }
}
export default CertinConfig;
