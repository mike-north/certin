import {
  ICertinConfig,
  IPartialCertinConfigOptions,
  ICertinUserFacingOptions
} from "@certin/types";

import Config from "./config";
export {
  createPopulatedCaCertConfig,
  createPopulatedDomainCertificateConfig,
  createPopulatedDomainSigningRequestConfig
} from "./openssl-templates";
export { Config };
/**
 * Create a config
 * @param opts options
 * @internal
 */
export function createConfig(opts: ICertinUserFacingOptions): Config {
  return new Config(opts);
}
