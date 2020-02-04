import { CertGenerationOptions } from "../cert-generation";
import {
  LOG_SEARCHING_FOR_CERT,
  LOG_FOUND_EXISTING_CERT,
  LOG_NO_EXISTING_CERT_FOUND,
  LOG_CREATE_NEW_CERT,
  LOG_SUDO_MISSING,
  SUDO_REASON_NEW_CERT_PERMISSIONS,
  LOG_CERT_GENERATION_COMPLETE,
  ASSERT_KEY_EXISTS,
  ASSERT_CERT_EXISTS
} from "@certin/messages";
import { hasSudo, UI } from "@certin/cliux";
import * as _createDebug from "debug";
import * as core from "../legacy";
import * as assert from "assert";

const debug = _createDebug("pemberly-secure:dev-cert");

export async function ensureDevCertExists(
  subjectName: string,
  options: CertGenerationOptions,
  ui: UI
): Promise<{ key: string; cert: string }> {
  const { subjectAlternateNames, days, caDays } = options;
  const { log } = ui.logger();
  debug(LOG_SEARCHING_FOR_CERT(subjectName));
  if (core.hasCertificateFor(subjectName)) {
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
    subjectName,
    subjectAlternateNames,
    {},
    {
      domainCertExpiry: days,
      caCertExpiry: caDays
    }
  );
  const { key: keyBuffer, cert: certBuffer } = returnVal;
  debug(LOG_CERT_GENERATION_COMPLETE(subjectName));

  assert.ok(keyBuffer, ASSERT_KEY_EXISTS);
  assert.ok(certBuffer, ASSERT_CERT_EXISTS);
  const key = keyBuffer.toString(),
    cert = certBuffer.toString();
  return { key, cert };
}
