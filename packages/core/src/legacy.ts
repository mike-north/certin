/** @packageDocumentation foo */

import { isLinux, isMac, isWindows } from "@certin/utils";
import { sync as commandExists } from "command-exists";
import * as _createDebug from "debug";
import { readFileSync } from "fs-extra";
import generateDomainCertificate, {
  IGenerateDomainCertOptions
} from "./certificates";
import currentPlatform from "./platforms";
import UI from "./user-interface";
import Workspace from "./workspace";

const debug = _createDebug("certin");

/**
 * Request an SSL certificate for the given app name signed by the root
 * certificate authority. If this library has previously generated a certificate for
 * that app name on this machine, it will reuse that certificate.
 *
 * If this is the first time this library is being run on this machine, it will
 * generate and attempt to install a root certificate authority.
 *
 * Returns a promise that resolves with \{ key, cert \}, where `key` and `cert`
 * are Buffers with the contents of the certificate private key and certificate
 * file, respectively
 *
 * If `options.getCaBuffer` is true, return value will include the ca certificate data
 * as \{ ca: Buffer \}
 *
 * If `options.getCaPath` is true, return value will include the ca certificate path
 * as \{ caPath: string \}
 *
 *
 *
 * @alpha
 */
export async function certificateFor(
  workspace: Workspace,
  arg: IGenerateDomainCertOptions
): Promise<{ key: Buffer; cert: Buffer }> {
  debug("foo");
  const { shouldSkipCertutilInstall, shouldSkipHostsFile, ui } = workspace;
  debug(
    `Certificate requested for ${arg.commonName}. Skipping certutil install: ${shouldSkipCertutilInstall}. Skipping hosts file: ${shouldSkipHostsFile}`
  );
  if (ui) {
    Object.assign(UI, ui);
  }

  if (!isMac && !isLinux && !isWindows) {
    throw new Error(`Platform not supported: "${process.platform}"`);
  }

  if (!commandExists("openssl")) {
    throw new Error(
      "OpenSSL not found: OpenSSL is required to generate SSL certificates - make sure it is installed and available in your PATH"
    );
  }
  const { commonName } = arg;
  const domainKeyPath = workspace.getKeyPathForDomain(commonName);
  const domainCertPath = workspace.getCertPathForDomain(commonName);

  if (!workspace.isRootCaInstalled()) {
    debug(
      "Root CA is not installed yet, so it must be our first run. Installing root CA ..."
    );
    await workspace.installCertificateAuthority();
  }

  if (!workspace.domainCertExists(commonName)) {
    debug(
      `Can't find certificate file for ${commonName}, so it must be the first request for ${commonName}. Generating and caching ...`
    );
    await generateDomainCertificate(workspace, arg);
  }

  if (!shouldSkipHostsFile) {
    await currentPlatform.addDomainToHostFileIfMissing(commonName);
  }

  debug(`Returning domain certificate`);
  return {
    key: readFileSync(domainKeyPath),
    cert: readFileSync(domainCertPath)
  };
}
