import { includeWildcards } from "@certin/utils";
import * as _createDebug from "debug";
import * as fs from "fs-extra";
import { template as makeTemplate } from "lodash";
import * as path from "path";
import * as pkgUp from "pkg-up";
import {
  ICACertConfigOptions,
  IDomainSigningRequestConfigOptions,
  IDomainCertificateConfigOptions
} from "@certin/types";

const debug = _createDebug("certin:config:openssl-templates");

const CERTIN_CONFIG_PACKAGE_JSON_PATH = pkgUp.sync({ cwd: __dirname });
if (!CERTIN_CONFIG_PACKAGE_JSON_PATH)
  throw new Error(
    "Could not find package.json path from within @certin/config"
  );
const CERTIN_CONFIG_PKG_ROOT = path.join(CERTIN_CONFIG_PACKAGE_JSON_PATH, "..");

function certinOpensslTemplateFilePath(name: string): string {
  return path.join(CERTIN_CONFIG_PKG_ROOT, "openssl-templates", name);
}

function readUtf8(pth: string): string {
  return fs.readFileSync(pth, "utf-8");
}

export const CA_CERT_CONFIG_PATH = certinOpensslTemplateFilePath(
  "certificate-authority-self-signing.conf"
);
export const DOMAIN_CSR_PATH = certinOpensslTemplateFilePath(
  "domain-certificate-signing-requests.conf"
);
export const DOMAIN_CERT_CONFIG_PATH = certinOpensslTemplateFilePath(
  "domain-certificates.conf"
);

debug(`openssl template paths below
CA_CERT_CONFIG_PATH: ${CA_CERT_CONFIG_PATH}
DOMAIN_CSR_PATH: ${DOMAIN_CSR_PATH}
DOMAIN_CERT_CONFIG_PATH: ${DOMAIN_CERT_CONFIG_PATH}`);

/**
 * Certificate authority openssl template (not-yet-populated)
 * @public
 */
export const CA_CERT_CONFIG_TEMPLATE = readUtf8(CA_CERT_CONFIG_PATH);
/**
 * Domain certificate signing request (CSR) template (not-yet-populated)
 * @public
 */
export const DOMAIN_CSR_TEMPLATE = readUtf8(DOMAIN_CSR_PATH);
/**
 * Domain certificate template (not-yet-populated)
 * @public
 */
export const DOMAIN_CERT_CONFIG_TEMPLATE = readUtf8(DOMAIN_CERT_CONFIG_PATH);

debug(`ca cert config
${CA_CERT_CONFIG_TEMPLATE}`);

debug(`domain csr config
${DOMAIN_CSR_TEMPLATE}`);

debug(`domain cert config
${DOMAIN_CERT_CONFIG_TEMPLATE}`);

/**
 * @internal
 */
export function createPopulatedCaCertConfig(
  opts: ICACertConfigOptions
): string {
  return makeTemplate(CA_CERT_CONFIG_TEMPLATE)(opts);
}

/**
 * @internal
 */
export function createPopulatedDomainSigningRequestConfig(
  opts: IDomainSigningRequestConfigOptions
): string {
  return makeTemplate(DOMAIN_CSR_TEMPLATE)({
    ...opts,
    subjectAltNames: includeWildcards([
      opts.commonName,
      ...opts.subjectAltNames
    ])
  });
}

/**
 * @internal
 */
export function createPopulatedDomainCertificateConfig(
  opts: IDomainCertificateConfigOptions
): string {
  return makeTemplate(DOMAIN_CERT_CONFIG_TEMPLATE)({
    ...opts,
    subjectAltNames: includeWildcards([
      opts.commonName,
      ...opts.subjectAltNames
    ])
  });
}
