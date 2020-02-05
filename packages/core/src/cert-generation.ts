import * as core from "./legacy";
import * as assert from "assert";
import * as chalk from "chalk";
import * as _debug from "debug";
import * as fs from "fs-extra";
import * as inquirer from "inquirer";
import { ensureDevCertExists } from "./cert-generation/dev";
import { ensureHeadlessCertExists } from "./cert-generation/headless";
import {
  ASSERT_CERT_IS_NOT_EMPTY,
  ASSERT_CERT_GENERATION_OUTPUT_MISSING,
  LOG_CERT_WROTE_TO_LOCATION,
  LOG_CLEANING_UP_TRUST_STORE,
  LOG_EXISTING_CERT_USER_RESPONSE_REQUIRED,
  LOG_EXITING_AT_USER_REQUEST,
  LOG_FORCE_MODE_ENABLED,
  LOG_PROCEEDING_IN_DEV_MODE,
  LOG_PROCEEDING_IN_HEADLESS_MODE,
  PROMPT_SHOULD_WE_OVERWRITE_IT,
  SUDO_REASON_CLEAN_TRUST_STORE_PERMISSIONS
} from "@certin/messages";
import { ICliUI } from "@certin/types";
import { hasSudo } from "@certin/utils";
import Workspace from "./workspace";

const debug = _debug("pemberly-secure");

// /**
//  * Certificate generation options
//  * @public
//  */
// export interface ICertGenerationOptions {
//   subjectAlternateNames: string[];
//   signDomainCertWithDevCa: boolean;
//   interactiveMode: boolean;
//   forceMode: boolean;
//   silentMode: boolean;
//   days: number;
//   caDays: number;
// }

// const DEFAULT_CERT_GENERATION_OPTIONS: ICertGenerationOptions = {
//   subjectAlternateNames: [],
//   signDomainCertWithDevCa: false,
//   interactiveMode: false,
//   forceMode: false,
//   silentMode: false,
//   days: 30,
//   caDays: 180
// };

/**
 * Generate a certificate, bound to a particular subject name (i.e., a domain)
 * @param subjectName - subject name of certificate
 * @param altNames - alternative names
 * @public
 */
export async function ensureCertExists(
  workspace: Workspace,
  subjectName: string,
  pemPath: string,
  ui: ICliUI
): Promise<void> {
  const { log } = ui.logger();
  let certResult: {
    key: string;
    cert: string;
  };
  if (
    workspace.cfg.options.domainCert.signWithDevCa &&
    workspace.cfg.options.ux.interactiveMode
  ) {
    debug(LOG_PROCEEDING_IN_DEV_MODE);
    certResult = await ensureDevCertExists(workspace, subjectName, ui);
  } else {
    debug(LOG_PROCEEDING_IN_HEADLESS_MODE);
    certResult = ensureHeadlessCertExists(workspace, subjectName, ui);
  }

  const { key, cert } = certResult;
  const { forceMode, interactiveMode } = workspace.cfg.options.ux;

  const foundExistingCert = fs.existsSync(pemPath);
  if (foundExistingCert) {
    if (forceMode) {
      debug(LOG_FORCE_MODE_ENABLED);
    } else {
      if (interactiveMode) {
        log(LOG_EXISTING_CERT_USER_RESPONSE_REQUIRED(pemPath));
        const overwriteResponse = await inquirer.prompt<{
          overwritePem: boolean;
        }>({
          message: PROMPT_SHOULD_WE_OVERWRITE_IT(pemPath),
          type: "confirm",
          name: "overwritePem",
          default: false
        });
        if (!overwriteResponse.overwritePem) {
          log(LOG_EXITING_AT_USER_REQUEST);
          process.exit(1);
        }
      } else {
        assert.ok(
          fs.existsSync(pemPath),
          ASSERT_CERT_GENERATION_OUTPUT_MISSING(pemPath)
        );
      }
    }
  }
  fs.writeFileSync(pemPath, `${key}\n${cert}`);

  const certSize = fs.statSync(pemPath).size;
  assert.ok(certSize > 0, ASSERT_CERT_IS_NOT_EMPTY);

  log(
    LOG_CERT_WROTE_TO_LOCATION({
      subjectName,
      subjectAlternateNames: workspace.cfg.options.domainCert.subjectAltNames,
      pemPath,
      certSize
    })
  );
}

/**
 * Remove any existing self-signed
 * certificates from the trust store.
 *
 * @beta
 */
export function cleanupTrustStore(ui: ICliUI, workspace: Workspace): void {
  const { log } = ui.logger();
  log(LOG_CLEANING_UP_TRUST_STORE);
  if (!hasSudo()) {
    ui.logPasswordRequestNotice(SUDO_REASON_CLEAN_TRUST_STORE_PERMISSIONS);
  }
  workspace.uninstallCA();
  log(`Trust store cleanup: ${chalk.green.bold("complete")}`);
}
