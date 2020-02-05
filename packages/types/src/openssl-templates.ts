/**
 * @internal
 */
export interface ICACertConfigOptions {
  name: string;
  defaultDays: number;
}
/**
 * @internal
 */
export interface IDomainSigningRequestConfigOptions {
  commonName: string;
  subjectAltNames: string[];
}

/**
 * @internal
 */
export interface IDomainCertificateConfigOptions {
  defaultCa: string;
  serial: string;
  database: string;
  newCertsDir: string;
  defaultDays: number;
  commonName: string;
  subjectAltNames: string[];
  signWithDevCa: boolean;
}
