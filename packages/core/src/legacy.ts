/** @packageDocumentation foo */

import { isLinux, isMac, isWindows } from "@certin/utils";
import { sync as commandExists } from "command-exists";
import * as _createDebug from "debug";
import { existsSync as exists, readFileSync as readFile } from "fs";
import installCertificateAuthority, {
  ensureCACertReadable
} from "./certificate-authority";
import generateDomainCertificate from "./certificates";

import currentPlatform from "./platforms";
import UI, { IUserInterface } from "./user-interface";
import Workspace from "./workspace";
import { ICaBuffer, ICaPath, IDomainData } from "@certin/types";

const debug = _createDebug("certin");

/**
 * @alpha
 */
export interface IOptions /* extends Partial<ICaBufferOpts & ICaPathOpts>  */ {
  /** Return the CA certificate data? */
  getCaBuffer?: boolean;
  /** Return the path to the CA certificate? */
  getCaPath?: boolean;
  /** If `certutil` is not installed already (for updating nss databases; e.g. firefox), do not attempt to install it */
  skipCertutilInstall?: boolean;
  /** Do not update your systems host file with the domain name of the certificate */
  skipHostsFile?: boolean;
  /** User interface hooks */
  ui?: IUserInterface;
}

/**
 * @alpha
 */
export type IReturnCa<O extends IOptions> = O["getCaBuffer"] extends true
  ? ICaBuffer
  : false;

/**
 * @alpha
 */
export type IReturnCaPath<O extends IOptions> = O["getCaPath"] extends true
  ? ICaPath
  : false;

/**
 * @alpha
 */
export type IReturnData<O extends IOptions = {}> = IDomainData &
  IReturnCa<O> &
  IReturnCaPath<O>;

async function certificateForImpl<O extends IOptions>(
  workspace: Workspace,
  commonName: string,
  alternativeNames: string[],
  options: O = {} as O
): Promise<IReturnData<O>> {
  debug(
    `Certificate requested for ${commonName}. Skipping certutil install: ${Boolean(
      options.skipCertutilInstall
    )}. Skipping hosts file: ${Boolean(options.skipHostsFile)}`
  );
  if (options.ui) {
    Object.assign(UI, options.ui);
  }

  if (!isMac && !isLinux && !isWindows) {
    throw new Error(`Platform not supported: "${process.platform}"`);
  }

  if (!commandExists("openssl")) {
    throw new Error(
      "OpenSSL not found: OpenSSL is required to generate SSL certificates - make sure it is installed and available in your PATH"
    );
  }

  const domainKeyPath = workspace.cfg.getPathForDomain(
    commonName,
    `private-key.key`
  );
  const domainCertPath = workspace.cfg.getPathForDomain(
    commonName,
    `certificate.crt`
  );

  if (!exists(workspace.cfg.rootCAKeyPath)) {
    debug(
      "Root CA is not installed yet, so it must be our first run. Installing root CA ..."
    );
    await installCertificateAuthority(workspace, options);
  } else if (options.getCaBuffer || options.getCaPath) {
    debug(
      "Root CA is not readable, but it probably is because an earlier version of certin locked it. Trying to fix..."
    );
    await ensureCACertReadable(workspace, options);
  }

  if (!exists(workspace.cfg.getPathForDomain(commonName, `certificate.crt`))) {
    debug(
      `Can't find certificate file for ${commonName}, so it must be the first request for ${commonName}. Generating and caching ...`
    );
    await generateDomainCertificate(workspace, commonName, alternativeNames);
  }

  if (!options.skipHostsFile) {
    await currentPlatform.addDomainToHostFileIfMissing(commonName);
  }

  debug(`Returning domain certificate`);

  const ret = {
    key: readFile(domainKeyPath),
    cert: readFile(domainCertPath)
  } as IReturnData<O>;
  if (options.getCaBuffer)
    (ret as ICaBuffer).ca = readFile(workspace.cfg.rootCACertPath);
  if (options.getCaPath) (ret as ICaPath).caPath = workspace.cfg.rootCACertPath;

  return ret;
}

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
export async function certificateFor<O extends IOptions>(
  workspace: Workspace,
  domain: string,
  options?: O
): Promise<IReturnData<O>>;
/**
 * @alpha
 */
export async function certificateFor<O extends IOptions>(
  workspace: Workspace,
  commonName: string,
  alternativeNames: string[],
  options?: O
): Promise<IReturnData<O>>;
export async function certificateFor<O extends IOptions>(
  workspace: Workspace,
  commonName: string,
  optionsOrAlternativeNames: string[] | O,
  options?: O
): Promise<IReturnData<O>> {
  if (Array.isArray(optionsOrAlternativeNames)) {
    return certificateForImpl(
      workspace,
      commonName,
      optionsOrAlternativeNames,
      options
    );
  } else {
    return certificateForImpl(workspace, commonName, [], options);
  }
}
