import { IAlertContent } from "@certin/types";
import * as chalk from "chalk";
import { resolve } from "path";

/**
 * Build a string (for logging purposes) describing
 * the name and alternative names of the certificate
 *
 * @param commonName - subject name of the cert
 * @param altNames - subject alternative names for the cert
 * @private
 */
function stringifyCommonNameAndAltNames(
  commonName: string,
  altNames: string[]
): string {
  const parts = [chalk.underline(commonName)];
  if (altNames.length > 0) {
    parts.push(
      chalk.dim(
        [
          "(with support for alternate names: ",
          altNames.map(an => chalk.underline(an)).join(", "),
          ")"
        ].join("")
      )
    );
  }
  return parts.join(" ");
}

/**
 * A notice describing why we need the user's password
 * @param reason - a description of why we need the user's password
 * @internal
 */
export const ALERT_PERMISSION_REQUIRED: Pick<IAlertContent, "title" | "nba"> = {
  title: `Your permission is required.`,
  nba: `Please enter your machine (sudo) password if you wish to proceed`
};

/** @internal */
export const LOG_SEARCHING_FOR_CERT = (subjectName: string): string =>
  `looking for an existing ${chalk.underline(subjectName)} certificate...`;

/** @internal */
export const LOG_FOUND_EXISTING_CERT = (subjectName: string): string =>
  `found existing cert for ${chalk.underline(subjectName)}`;

/** @internal */
export const LOG_NO_EXISTING_CERT_FOUND = (subjectName: string): string =>
  `no existing certificate found for ${chalk.underline(subjectName)}`;

/** @internal */
export const LOG_SUDO_MISSING = `process is NOT running with sudo. A password from the user is required`;
/** @internal */
export const LOG_CREATE_NEW_CERT = ({
  commonName,
  subjectAltNames
}: {
  commonName: string;
  subjectAltNames: string[];
}): string =>
  `creating a new x509 certificate for ${stringifyCommonNameAndAltNames(
    commonName,
    subjectAltNames
  )}`;

/** @internal */
export const LOG_CERT_GENERATION_COMPLETE = (subjectName: string): string =>
  `completed cert generation for ${chalk.yellow(subjectName)}`;

/** @internal */
export const SUDO_REASON_NEW_CERT_PERMISSIONS =
  "we are attempting to set appropriate file permissions on your new cert and private key";
/** @internal */
export const SUDO_REASON_CLEAN_TRUST_STORE_PERMISSIONS =
  "we need your permission to access your OS trust store, in order to remove any pertinent self-signed certificates";

/** @internal */
export const LOG_CERT_WROTE_TO_LOCATION = ({
  commonName,
  subjectAltNames,
  pemPath,
  certSize
}: {
  commonName: string;
  subjectAltNames: string[];
  pemPath: string;
  certSize: number;
}): string =>
  `wrote x509 certificate for ${stringifyCommonNameAndAltNames(
    commonName,
    subjectAltNames
  )} to ${chalk.blueBright(resolve(pemPath))} ${chalk.magenta(
    `(${Math.round(certSize / 100) / 10} Kb)`
  )}`;

/** @internal */
export const LOG_PROCEEDING_IN_DEV_MODE =
  "proceeding with DEVELOPMENT domain cert generation. this cert WILL be signed by a developers self-signed CA";

/** @internal */
export const LOG_PROCEEDING_IN_HEADLESS_MODE =
  "proceeding with HEADLESS domain cert generation. this cert WILL NOT be signed by a developers self-signed CA";

/** @internal */
export const LOG_FORCE_MODE_ENABLED =
  "--force argument detected and an existing cert was found. It will written over";

/** @internal */
export const PROMPT_SHOULD_WE_OVERWRITE_IT = (pemPath: string): string =>
  `Would you like to overwrite ${pemPath}?`;

/** @internal */
export const LOG_EXITING_AT_USER_REQUEST = "Exiting at user's request";
/** @internal */
export const LOG_EXISTING_CERT_USER_RESPONSE_REQUIRED = (
  pemPath: string
): string =>
  `an existing file was found at your specified output path ${chalk.blueBright(
    pemPath
  )}.`;

/** @internal */
export const ASSERT_CERT_GENERATION_OUTPUT_MISSING = (
  pemPath: string
): string => `pem file at ${pemPath} was not found after generation attempt`;

/** @internal */
export const ASSERT_CERT_IS_NOT_EMPTY = ".pem file has nonzero size";
/** @internal */
export const ASSERT_CERT_EXISTS = "cert content exists";
/** @internal */
export const ASSERT_KEY_EXISTS = "key content exists";

/** @internal */
export const LOG_CLEANING_UP_TRUST_STORE = `Cleaning up any relevant self-signed certificates from your trust store`;
/** @internal */
export const ERROR_WHILE_SUDOING = (err: any): string =>
  `Unexpected error while trying to detect sudo elevation: ${err.toString()}`;
