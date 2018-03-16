import { Options } from '../index';


export interface Platform {
   addToTrustStores(certificatePath: string, options?: Options): Promise<void>;
   addDomainToHostFileIfMissing(domain: string): Promise<void>;
}

const PlatformClass = require(`./${ process.platform }`).default;
export default new PlatformClass() as Platform;
