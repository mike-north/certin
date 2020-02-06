// import path from 'path';
import * as createDebug from "debug";
import { sync as mkdirp } from "mkdirp";
import { chmodSync as chmod } from "fs";

import Workspace from "./workspace";
import {
  IDomainSigningRequestConfig,
  IDomainCertificateConfig
} from "@certin/types";

const debug = createDebug("certin:certificates");

// Generate a cryptographic key, used to sign certificates or certificate signing requests.
export function generateKey(workspace: Workspace, filename: string): void {
  debug(`generateKey: ${filename}`);
  workspace.openssl([`genrsa`, `-out`, `"${filename}"`, `2048`]);
  chmod(filename, 400);
}

export interface IGenerateDomainCertOptions {
  commonName: string;
  subjectAltNames: string[];
  defaultDays: number;
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
  opts: IGenerateDomainCertOptions
): Promise<void> {
  const { commonName, subjectAltNames, defaultDays } = opts;
  workspace.ensureDomainPathExists(commonName);

  debug(`Generating private key for ${commonName}`);
  const domainKeyPath = workspace.getKeyPathForDomain(commonName);
  generateKey(workspace, domainKeyPath);

  debug(`Generating certificate signing request for ${commonName}`);
  const csrFile = workspace.getCsrPathForDomain(commonName);
  workspace.withDomainSigningRequestConfig(
    { commonName, subjectAltNames },
    configpath => {
      workspace.openssl([
        `req`,
        `-new`,
        `-config`,
        `"${configpath}"`,
        `-key`,
        `"${domainKeyPath}"`,
        `-out`,
        `"${csrFile}"`,
        `-days ${defaultDays}`
      ]);
    }
  );

  debug(
    `Generating certificate for ${commonName} from signing request and signing with root CA`
  );
  const domainCertPath = workspace.getCertPathForDomain(commonName);

  await workspace.withCertificateAuthorityCredentials(
    ({ caKeyPath, caCertPath }) => {
      workspace.withDomainCertificateConfig(
        { commonName, subjectAltNames },
        domainCertConfigPath => {
          workspace.openssl([
            `ca`,
            `-config`,
            `"${domainCertConfigPath}"`,
            `-in`,
            `"${csrFile}"`,
            `-out`,
            `"${domainCertPath}"`,
            `-keyfile`,
            `"${caKeyPath}"`,
            `-cert`,
            `"${caCertPath}"`,
            `-days`,
            `${defaultDays}`,
            `-batch`
          ]);
        }
      );
    }
  );
}
