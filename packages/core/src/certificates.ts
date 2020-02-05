// import path from 'path';
import * as createDebug from "debug";
import { sync as mkdirp } from "mkdirp";
import { chmodSync as chmod } from "fs";

import { openssl } from "./utils";
import Workspace from "./workspace";

const debug = createDebug("certin:certificates");

// Generate a cryptographic key, used to sign certificates or certificate signing requests.
export function generateKey(workspace: Workspace, filename: string): void {
  debug(`generateKey: ${filename}`);
  openssl(workspace.cfg, `genrsa -out "${filename}" 2048`);
  chmod(filename, 400);
}

/**
 * Generate a domain certificate signed by the root CA. Domain
 * certificates are cached in their own directories under
 * CONFIG_ROOT/domains/<domain>, and reused on subsequent requests. Because the
 * individual domain certificates are signed by the root CA (which was
 * added to the OS/browser trust stores), they are trusted.
 */
export default async function generateDomainCertificate(
  workspace: Workspace,
  commonName: string,
  alternativeNames: string[]
): Promise<void> {
  mkdirp(workspace.cfg.getPathForDomain(commonName));

  debug(`Generating private key for ${commonName}`);
  const domainKeyPath = workspace.cfg.getPathForDomain(
    commonName,
    "private-key.key"
  );
  generateKey(workspace, domainKeyPath);

  debug(`Generating certificate signing request for ${commonName}`);
  const csrFile = workspace.cfg.getPathForDomain(
    commonName,
    `certificate-signing-request.csr`
  );
  workspace.withDomainSigningRequestConfig(
    { commonName, subjectAltNames: alternativeNames },
    configpath => {
      openssl(
        workspace.cfg,
        `req -new -config "${configpath}" -key "${domainKeyPath}" -out "${csrFile}" -days ${workspace.cfg.options.domainCert.defaultDays}`
      );
    }
  );

  debug(
    `Generating certificate for ${commonName} from signing request and signing with root CA`
  );
  const domainCertPath = workspace.cfg.getPathForDomain(
    commonName,
    `certificate.crt`
  );

  await workspace.withCertificateAuthorityCredentials(
    ({ caKeyPath, caCertPath }) => {
      workspace.withDomainCertificateConfig(
        { commonName, subjectAltNames: alternativeNames },
        domainCertConfigPath => {
          openssl(
            workspace.cfg,
            `ca -config "${domainCertConfigPath}" -in "${csrFile}" -out "${domainCertPath}" -keyfile "${caKeyPath}" -cert "${caCertPath}" -days ${workspace.cfg.options.domainCert.defaultDays} -batch`
          );
        }
      );
    }
  );
}
