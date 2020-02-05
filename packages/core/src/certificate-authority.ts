import * as createDebug from "debug";
import { writeFileSync as writeFile } from "fs";
import { generateKey } from "./certificates";
import { IOptions } from "./legacy";
import currentPlatform from "./platforms";
import { mktmp, openssl } from "./utils";
import Workspace from "./workspace";

const debug = createDebug("certin:certificate-authority");

/**
 * Install the once-per-machine trusted root CA. We'll use this CA to sign
 * per-app certs.
 *
 * @internal
 */
export default async function installCertificateAuthority(
  workspace: Workspace,
  options: IOptions = {}
): Promise<void> {
  debug(
    `Uninstalling existing certificates, which will be void once any existing CA is gone`
  );
  workspace.uninstallCA();
  workspace.cfg.ensureConfigDirs();

  debug(`Making a temp working directory for files to copied in`);
  const rootKeyPath = mktmp();

  debug(
    `Generating the OpenSSL configuration needed to setup the certificate authority`
  );
  workspace.seedConfigFiles();

  debug(`Generating a private key`);
  generateKey(workspace, rootKeyPath);

  debug(`Generating a CA certificate`);
  openssl(workspace.cfg, workspace.getOpenSSLCaGenerationCommand(rootKeyPath));

  debug("Saving certificate authority credentials");
  await workspace.saveCertificateAuthorityCredentials(rootKeyPath);

  debug(`Adding the root certificate authority to trust stores`);
  await currentPlatform.addToTrustStores(workspace.cfg.rootCACertPath, options);
}

/**
 * @internal
 */
function certErrors(workspace: Workspace): string {
  try {
    openssl(workspace.cfg, `x509 -in "${workspace.cfg.rootCACertPath}" -noout`);
    return "";
  } catch (e) {
    return e.toString();
  }
}

// This function helps to migrate from v1.0.x to >= v1.1.0.
/**
 * Smoothly migrate the certificate storage from v1.0.x to >= v1.1.0.
 * In v1.1.0 there are new options for retrieving the CA cert directly,
 * to help third-party Node apps trust the root CA.
 *
 * If a v1.0.x cert already exists, then we have written it with
 * platform.writeProtectedFile(), so an unprivileged readFile cannot access it.
 * Pre-detect and remedy this; it should only happen once per installation.
 *
 * @internal
 */
export async function ensureCACertReadable(
  workspace: Workspace,
  options: IOptions
): Promise<void> {
  if (!certErrors(workspace)) {
    return;
  }
  /**
   * on windows, writeProtectedFile left the cert encrypted on *nix, the cert
   * has no read permissions either way, openssl will fail and that means we
   * have to fix it
   */
  try {
    const caFileContents = await currentPlatform.readProtectedFile(
      workspace.cfg.rootCACertPath
    );
    currentPlatform.deleteProtectedFiles(workspace.cfg.rootCACertPath);
    writeFile(workspace.cfg.rootCACertPath, caFileContents);
  } catch (e) {
    return installCertificateAuthority(workspace, options);
  }

  // double check that we have a live one
  const remainingErrors = certErrors(workspace);
  if (remainingErrors) {
    return installCertificateAuthority(workspace, options);
  }
}
