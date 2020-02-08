import {
  ASSERT_CERT_EXISTS,
  ASSERT_KEY_EXISTS,
  LOG_CERT_GENERATION_COMPLETE,
  LOG_CREATE_NEW_CERT,
  LOG_FOUND_EXISTING_CERT,
  LOG_NO_EXISTING_CERT_FOUND,
  LOG_SEARCHING_FOR_CERT,
  LOG_SUDO_MISSING,
  SUDO_REASON_NEW_CERT_PERMISSIONS
} from "@certin/messages";
import { ICliUI } from "@certin/types";
import { hasSudo } from "@certin/utils";
import * as assert from "assert";
import * as _createDebug from "debug";
import * as core from "../legacy";
import Workspace from "../workspace";

const debug = _createDebug("certin:dev-cert");

export interface IEnsureDevCertExistsArg {
  commonName: string;
  subjectAltNames?: string[];
  days?: number;
}

export async function ensureDevCertExists(
  workspace: Workspace,
  ui: ICliUI,
  arg: IEnsureDevCertExistsArg
): Promise<{ key: string; cert: string }> {
  const { subjectAltNames = [], commonName, days = 30 } = arg;
  const { log } = ui.logger();
  debug(LOG_SEARCHING_FOR_CERT(commonName));
  if (workspace.hasCertificateFor(commonName)) {
    debug(LOG_FOUND_EXISTING_CERT(commonName));
  } else {
    log(LOG_NO_EXISTING_CERT_FOUND(commonName));
    log(LOG_CREATE_NEW_CERT({ commonName, subjectAltNames }));
    if (!hasSudo()) {
      debug(LOG_SUDO_MISSING);
      ui.logPasswordRequestNotice(SUDO_REASON_NEW_CERT_PERMISSIONS);
    }
  }
  debug("beginning cert creation process");
  const returnVal = await core.certificateFor(workspace, {
    commonName,
    subjectAltNames,
    defaultDays: days
  });
  debug("cert creation process complete");
  const { key: keyBuffer, cert: certBuffer } = returnVal;
  debug(LOG_CERT_GENERATION_COMPLETE(commonName));

  assert.ok(keyBuffer, ASSERT_KEY_EXISTS);
  assert.ok(certBuffer, ASSERT_CERT_EXISTS);
  const key = keyBuffer.toString(),
    cert = certBuffer.toString();
  return { key, cert };
}
