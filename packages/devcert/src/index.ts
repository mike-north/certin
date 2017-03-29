import {
  readFileSync,
  readdirSync,
  writeFileSync,
  unlinkSync,
  chmodSync,
  existsSync
} from 'fs';
import * as path from 'path';
import * as getPort from 'get-port';
import * as http from 'http';
import { execSync } from 'child_process';
import * as tmp from 'tmp';
import * as glob from 'glob';
import * as Configstore from 'configstore';
import { sync as commandExists } from 'command-exists';

const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';
const isWindows = process.platform === 'win32';

// use %LOCALAPPDATA%/Yarn on Windows otherwise use ~/.config/yarn
let configDir: string;
if (isWindows && process.env.LOCALAPPDATA) {
  configDir = path.join(process.env.LOCALAPPDATA, 'Yarn', 'config');
} else {
  let uid = process.getuid && process.getuid();
  let userHome = (isLinux && uid === 0) ? path.resolve('/usr/local/share') : require('os').homedir();
  path.join(userHome, '.config', 'yarn');
}
const configPath = path.join.bind(path, configDir);

const opensslConfPath = path.join(__dirname, '..', 'openssl.conf');
const rootKeyPath = configPath('devcert-ca-root.key');
const rootCertPath = configPath('devcert-ca-root.crt');

interface Options {
  installCertutil?: boolean;
}

interface Certificate {
  key: string;
  cert: string;
}

export default function devcert(appName: string, options: Options = {}) {

  // Fail fast on unsupported platforms (PRs welcome!)
  if (!isMac && !isLinux && !isWindows) {
    throw new Error(`devcert: "${ process.platform }" platform not supported`);
  }
  if (!commandExists('openssl')) {
    throw new Error('Unable to find openssl - make sure it is installed and available in your PATH');
  }

  if (!existsSync(configPath('devcert-ca-root.key'))) {
    installCertificateAuthority(options.installCertutil);
  }

  // Load our root CA and sign a new app cert with it.
  let appKeyPath = generateKey(appName);
  let appCertificatePath = generateSignedCertificate(appName, appKeyPath);

  return {
    keyPath: appKeyPath,
    certificatePath: appCertificatePath,
    key: readFileSync(appKeyPath),
    certificate: readFileSync(appCertificatePath)
  };

}

// Install the once-per-machine trusted root CA. We'll use this CA to sign per-app certs, allowing
// us to minimize the need for elevated permissions while still allowing for per-app certificates.
function installCertificateAuthority(installCertutil) {
  let rootKeyPath = generateKey('devcert-ca-root');
  execSync(`openssl req -config ${ opensslConfPath } -key ${ rootKeyPath } -out ${ rootCertPath } -new -subj '/CN=devcert' -x509 -days 7000 -extensions v3_ca`);
  addCertificateToTrustStores(installCertutil);
}

// Generate a cryptographic key, used to sign certificates or certificate signing requests.
function generateKey(name: string): string {
  let filename = configPath(`${ name }.key`);
  execSync(`openssl genrsa -out ${ filename } 2048`);
  chmodSync(filename, 400);
  return filename;
}

// Generate a certificate signed by the devcert root CA
function generateSignedCertificate(name: string, keyPath: string): string {
  let csrFile = configPath(`${ name }.csr`)
  execSync(`openssl req -config ${ opensslConfPath } -subj '/CN=${ name }' -key ${ keyPath } -out ${ csrFile } -new`);
  let certPath = configPath(`${ name }.crt`);
  execSync(`openssl ca -config ${ opensslConfPath } -in ${ csrFile } -out ${ certPath } -keyfile ${ rootKeyPath } -cert ${ rootCertPath } -notext -md sha256 -days 7000 -extensions server_cert`)
  return certPath;
}

// Add the devcert root CA certificate to the trust stores for this machine. Adds to OS level trust
// stores, and where possible, to browser specific trust stores
async function addCertificateToTrustStores(installCertutil: boolean): Promise<void> {

  if (isMac) {
    // Chrome, Safari, system utils
    execSync(`sudo security add-trusted-cert -r trustRoot -k /Library/Keychains/System.keychain -p ssl "${ rootCertPath }"`);
    // Firefox
    try {
      // Try to use certutil to install the cert automatically
      addCertificateToNSSCertDB('~/Library/Application Support/Firefox/Profiles/*', installCertutil);
    } catch (e) {
      // Otherwise, open the cert in Firefox to install it
      await openCertificateInFirefox('/Applications/Firefox.app/Contents/MacOS/firefox');
    }

  } else if (isLinux) {
    // system utils
    execSync(`sudo cp ${ rootCertPath } /usr/local/share/ca-certificates/devcert.cer && update-ca-certificates`);
    // Firefox
    try {
      // Try to use certutil to install the cert automatically
      addCertificateToNSSCertDB('~/.mozilla/firefox/*', installCertutil);
    } catch (e) {
      // Otherwise, open the cert in Firefox to install it
      await openCertificateInFirefox('firefox');
    }
    // Chrome
    // No try..catch, since there's no alternative here. Chrome won't prompt to add a cert to the
    // store if opened as a URL
    addCertificateToNSSCertDB('~/.pki/nssdb', installCertutil);

  // Windows
  } else if (isWindows) {
    // IE, Chrome, system utils
    execSync(`certutil -addstore -user root ${ rootCertPath }`);
    // Firefox (don't even try NSS certutil, no easy install for Windows)
    await openCertificateInFirefox('start firefox');
  }

}

// Try to use certutil to add the root cert to an NSS database
function addCertificateToNSSCertDB(nssDirGlob: string, installCertutil: boolean): void {
  let certutilPath = lookupOrInstallCertutil(installCertutil);
  if (!certutilPath) {
    throw new Error('certutil not available, and `installCertutil` was false');
  }
  glob.sync(nssDirGlob).forEach((potentialNSSDBDir) => {
    if (existsSync(path.join(potentialNSSDBDir, 'cert8.db'))) {
      execSync(`${ certutilPath } -A -d ${ potentialNSSDBDir } -t 'C,,' -i ${ rootCertPath }`);
    } else if (existsSync(path.join(potentialNSSDBDir, 'cert9.db'))) {
      execSync(`${ certutilPath } -A -d sql:${ potentialNSSDBDir } -t 'C,,' -i ${ rootCertPath }`);
    }
  });
}

// Launch a web server and open the root cert in Firefox. Useful for when certutil isn't available
async function openCertificateInFirefox(firefoxPath: string) {
  let port = await getPort();
  let server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-type': 'application/x-x509-ca-cert' });
    res.write(readFileSync(rootCertPath));
    res.end();
  }).listen(port);
  execSync(`${ firefoxPath } http://localhost:${ port }`);
  await new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.on('data', resolve);
  });
}

// Try to install certutil if it's not already available, and return the path to the executable
function lookupOrInstallCertutil(options: Options): boolean | string {
  if (isMac) {
    if (commandExists('brew')) {
      let nssPath: string;
      try {
        return path.join(execSync('brew --prefix nss').toString(), 'bin', 'certutil');
      } catch (e) {
        if (options.installCertutil) {
          execSync('brew install nss');
          return path.join(execSync('brew --prefix nss').toString(), 'bin', 'certutil');
        }
      }
    }
  } else if (isLinux) {
    if (!commandExists('certutil')) {
      if (options.installCertutil) {
        execSync('sudo apt install libnss3-tools');
      } else {
        return false;
      }
    }
    return execSync('which certutil').toString();
  }
  return false;
}
