import {
  ICACertConfigOptions,
  IDomainCertificateConfigOptions,
  IDomainSigningRequestConfigOptions
} from "./openssl-templates";
/**
 * @internal
 */
export interface ICertinConfigUxOptions {
  appName: string;
  interactiveMode: boolean;
  forceMode: boolean;
  silentMode: boolean;
}

/**
 * @internal
 */
export interface ICertinConfigOptions {
  ux: ICertinConfigUxOptions;
  ca: ICACertConfigOptions;
  domainCsr: IDomainSigningRequestConfigOptions;
  domainCert: IDomainCertificateConfigOptions;
}

/**
 * @internal
 */
export interface IPartialCertinConfigOptions {
  ux?: Partial<ICertinConfigUxOptions>;
  ca?: Partial<ICACertConfigOptions>;
  domainCsr?: Partial<IDomainSigningRequestConfigOptions> & {
    commonName: string;
  };
  domainCert?: Partial<IDomainCertificateConfigOptions> & {
    commonName: string;
  };
}

/**
 * @internal
 */
export interface ICertinConfig {
  configDir: string;
  rootCADir: string;
  rootCAKeyPath: string;
  caSelfSignConfig: string;
  rootCACertPath: string;
  domainsDir: string;
  caVersionFile: string;
  opensslDatabaseFilePath: string;
  opensslSerialFilePath: string;
  getConfigPath(...pathSegments: string[]): string;
  getPathForDomain(domain: string, ...pathSegments: string[]): string;
  getConfigDir(): string;
  ensureConfigDirs(): void;
}

/**
 * @public
 */
export interface ICertinUserFacingOptions {
  ux?: {
    appName?: string;
    interactiveMode?: boolean;
    forceMode?: boolean;
    silentMode?: boolean;
  };
  domainCert?: {
    commonName: string;
    signWithDevCa?: boolean;
    subjectAlternativeNames?: string[];
    daysUntilExpire?: number;
  };
  ca?: {
    name?: string;
    label?: string;
    daysUntilExpire?: number;
  };
}
