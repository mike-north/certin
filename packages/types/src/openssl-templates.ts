/**
 * @internal
 */
export interface ICACertConfig {
  name: string;
  defaultDays: number;
}
/**
 * @internal
 */
export interface IDomainSigningRequestConfig {
  commonName: string;
  subjectAltNames: string[];
}

/**
 * @internal
 */
export interface IDomainCertificateConfig {
  defaultCa: string;
  serial: string;
  database: string;
  newCertsDir: string;
  defaultDays: number;
  commonName: string;
  subjectAltNames: string[];
  signWithDevCa: boolean;
}
