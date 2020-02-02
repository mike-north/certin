import { readFileSync as readFile, readdirSync as readdir, existsSync as exists } from 'fs';
import createDebug from 'debug';
import { sync as commandExists } from 'command-exists';
import rimraf from 'rimraf';
import {
  isMac,
  isLinux,
  isWindows,
  pathForDomain,
  domainsDir,
  rootCAKeyPath,
  rootCACertPath
} from './constants';
import currentPlatform from './platforms';
import installCertificateAuthority, { ensureCACertReadable, uninstall } from './certificate-authority';
import generateDomainCertificate from './certificates';
import UI, { UserInterface } from './user-interface';
export { uninstall };

const debug = createDebug('devcert');
export interface CertOptions {
  /** Number of days before the CA expires */
  caCertExpiry: number;
  /** Number of days before the domain certificate expires */
  domainCertExpiry: number;
}
export interface Options /* extends Partial<ICaBufferOpts & ICaPathOpts>  */{
  /** Return the CA certificate data? */
  getCaBuffer?: boolean;
  /** Return the path to the CA certificate? */
  getCaPath?: boolean;
  /** If `certutil` is not installed already (for updating nss databases; e.g. firefox), do not attempt to install it */
  skipCertutilInstall?: boolean,
  /** Do not update your systems host file with the domain name of the certificate */
  skipHostsFile?: boolean,
  /** User interface hooks */
  ui?: UserInterface
}

interface ICaBuffer {
  ca: Buffer;
}
interface ICaPath {
  caPath: string;
}
interface IDomainData {
  key: Buffer;
  cert: Buffer;
}
type IReturnCa<O extends Options> = O['getCaBuffer'] extends true ? ICaBuffer : false;
type IReturnCaPath<O extends Options> = O['getCaPath'] extends true ? ICaPath : false;
type IReturnData<O extends Options = {}> = (IDomainData) & (IReturnCa<O>) & (IReturnCaPath<O>);


const DEFAULT_CERT_OPTIONS: CertOptions = {
  caCertExpiry: 180,
  domainCertExpiry: 30
}

/**
 * Request an SSL certificate for the given app name signed by the devcert root
 * certificate authority. If devcert has previously generated a certificate for
 * that app name on this machine, it will reuse that certificate.
 *
 * If this is the first time devcert is being run on this machine, it will
 * generate and attempt to install a root certificate authority.
 *
 * Returns a promise that resolves with { key, cert }, where `key` and `cert`
 * are Buffers with the contents of the certificate private key and certificate
 * file, respectively
 * 
 * If `options.getCaBuffer` is true, return value will include the ca certificate data
 * as { ca: Buffer }
 * 
 * If `options.getCaPath` is true, return value will include the ca certificate path
 * as { caPath: string }
 */
export async function certificateFor<O extends Options, CO extends Partial<CertOptions>>(domain: string, options?: O, partialCertOptions?: CO): Promise<IReturnData<O>>;
export async function certificateFor<O extends Options, CO extends Partial<CertOptions>>(commonName: string, alternativeNames: string[], options?: O, partialCertOptions?: CO): Promise<IReturnData<O>>;
export async function certificateFor<O extends Options, CO extends Partial<CertOptions>>(commonName: string, optionsOrAlternativeNames: string[] | O, options?: O, partialCertOptions?: CO): Promise<IReturnData<O>> {
  if (Array.isArray(optionsOrAlternativeNames)) {
    return certificateForImpl(commonName, optionsOrAlternativeNames, options, partialCertOptions);
  } else {
    return certificateForImpl(commonName, [], options, partialCertOptions);
  }
}

async function certificateForImpl<O extends Options, CO extends Partial<CertOptions>>(commonName: string, alternativeNames: string[], options: O = {} as O, partialCertOptions: CO = {} as CO): Promise<IReturnData<O>> {
  debug(`Certificate requested for ${ commonName }. Skipping certutil install: ${ Boolean(options.skipCertutilInstall) }. Skipping hosts file: ${ Boolean(options.skipHostsFile) }`);
  const certOptions = {...DEFAULT_CERT_OPTIONS, ...partialCertOptions}
  if (options.ui) {
    Object.assign(UI, options.ui);
  }

  if (!isMac && !isLinux && !isWindows) {
    throw new Error(`Platform not supported: "${ process.platform }"`);
  }

  if (!commandExists('openssl')) {
    throw new Error('OpenSSL not found: OpenSSL is required to generate SSL certificates - make sure it is installed and available in your PATH');
  }

  let domainKeyPath = pathForDomain(commonName, `private-key.key`);
  let domainCertPath = pathForDomain(commonName, `certificate.crt`);

  if (!exists(rootCAKeyPath)) {
    debug('Root CA is not installed yet, so it must be our first run. Installing root CA ...');
    await installCertificateAuthority(options, certOptions);
  } else if (options.getCaBuffer || options.getCaPath) {
    debug('Root CA is not readable, but it probably is because an earlier version of devcert locked it. Trying to fix...');
    await ensureCACertReadable(options, certOptions);
  }

  if (!exists(pathForDomain(commonName, `certificate.crt`))) {
    debug(`Can't find certificate file for ${ commonName }, so it must be the first request for ${ commonName }. Generating and caching ...`);
    await generateDomainCertificate(commonName, alternativeNames, certOptions);
  }

  if (!options.skipHostsFile) {
    await currentPlatform.addDomainToHostFileIfMissing(commonName);
  }

  debug(`Returning domain certificate`);

  const ret = {
    key: readFile(domainKeyPath),
    cert: readFile(domainCertPath)
  } as IReturnData<O>;
  if (options.getCaBuffer) (ret as ICaBuffer).ca = readFile(rootCACertPath);
  if (options.getCaPath) (ret as ICaPath).caPath = rootCACertPath;

  return ret;
}

export function hasCertificateFor(commonName: string) {
  return exists(pathForDomain(commonName, `certificate.crt`));
}

export function configuredDomains() {
  return readdir(domainsDir);
}

export function removeDomain(commonName: string) {
  return rimraf.sync(pathForDomain(commonName));
}
