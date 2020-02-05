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

const debug = _createDebug("pemberly-secure:dev-cert");

export async function ensureDevCertExists(
  workspace: Workspace,
  subjectName: string,
  ui: ICliUI
): Promise<{ key: string; cert: string }> {
  const {
    subjectAltNames: subjectAlternateNames
  } = workspace.cfg.options.domainCert;
  const { log } = ui.logger();
  debug(LOG_SEARCHING_FOR_CERT(subjectName));
  if (workspace.hasCertificateFor(subjectName)) {
    debug(LOG_FOUND_EXISTING_CERT(subjectName));
  } else {
    log(LOG_NO_EXISTING_CERT_FOUND(subjectName));
    log(LOG_CREATE_NEW_CERT({ subjectName, subjectAlternateNames }));
    if (!hasSudo()) {
      debug(LOG_SUDO_MISSING);
      ui.logPasswordRequestNotice(SUDO_REASON_NEW_CERT_PERMISSIONS);
    }
  }
  const returnVal = await core.certificateFor(
    workspace,
    subjectName,
    subjectAlternateNames,
    {}
  );
  const { key: keyBuffer, cert: certBuffer } = returnVal;
  debug(LOG_CERT_GENERATION_COMPLETE(subjectName));

  assert.ok(keyBuffer, ASSERT_KEY_EXISTS);
  assert.ok(certBuffer, ASSERT_CERT_EXISTS);
  const key = keyBuffer.toString(),
    cert = certBuffer.toString();
  return { key, cert };
}
