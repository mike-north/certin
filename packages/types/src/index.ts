export { ExtractArgs } from "@mike-north/types";
export { IAlertContent, ILoggerFn, ILogger, ICliUI } from "./cli";
export {
  ICertinConfig,
  ICertinConfigOptions,
  IPartialCertinConfigOptions,
  ICertinConfigUxOptions,
  ICertinUserFacingOptions
} from "./config";

/**
 * @alpha
 */
export interface ICaBuffer {
  ca: Buffer;
}

/**
 * @alpha
 */
export interface ICaPath {
  caPath: string;
}

/**
 * @alpha
 */
export interface IDomainData {
  key: Buffer;
  cert: Buffer;
}

export {
  IDomainCertificateConfigOptions,
  ICACertConfigOptions,
  IDomainSigningRequestConfigOptions
} from "./openssl-templates";
