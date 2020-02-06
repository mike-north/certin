export { ExtractArgs } from "@mike-north/types";
export { IAlertContent, ILoggerFn, ILogger, ICliUI } from "./cli";
export { ICertinConfig, IPartialCertinConfig, ICertinUxConfig } from "./config";

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
  IDomainCertificateConfig,
  ICACertConfig,
  IDomainSigningRequestConfig
} from "./openssl-templates";
/**
 * @internal
 */
export type Primitive = string | number | boolean | null | undefined | symbol;
/**
 * @internal
 */
export type DeepPartial<O> = O extends Primitive | Function
  ? O
  : {
      [K in keyof O]?: O[K] extends undefined ? O[K] : DeepPartial<O[K]>;
    };
export { ISystemUserInterface } from "./system";
