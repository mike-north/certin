import {
  ICACertConfig,
  IDomainCertificateConfig,
  IDomainSigningRequestConfig
} from "./openssl-templates";
/**
 * @internal
 */
export interface ICertinUxConfig {
  appName: string;
  interactiveMode: boolean;
  forceMode: boolean;
  silentMode: boolean;
}

/**
 * @internal
 */
export interface ICertinConfig {
  ux: ICertinUxConfig;
  ca: ICACertConfig;
  domainCsr: IDomainSigningRequestConfig;
  domainCert: IDomainCertificateConfig;
}

/**
 * @internal
 */
export interface IPartialCertinConfig {
  ux?: Partial<ICertinUxConfig>;
  ca?: Partial<ICACertConfig>;
  domainCsr?: Partial<IDomainSigningRequestConfig> & {
    commonName: string;
  };
  domainCert?: Partial<IDomainCertificateConfig> & {
    commonName: string;
  };
}
