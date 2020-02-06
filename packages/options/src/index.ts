import { Config, IConfigArg } from "@certin/config";
import { DeepPartial, ISystemUserInterface } from "@certin/types";
import {
  APP_NAME,
  DEFAULT_CA_DAYS_UNTIL_EXPIRE,
  DEFAULT_CA_LABEL,
  DEFAULT_CA_NAME,
  DEFAULT_DOMAIN_CERT_DAYS_UNTIL_EXPIRE,
  DEFAULT_DOMAIN_CERT_SIGN_WITH_CA,
  FORCE,
  IS_INTERACTIVE,
  SILENT,
  SKIP_CERTUTIL_INSTALL,
  SKIP_HOSTS_FILE
} from "./defaults";

/**
 * @alpha
 */
export class Options {
  private arg: ICertinOptionsArg;
  private _ui?: ISystemUserInterface;
  public constructor(
    arg: DeepPartial<ICertinOptionsArg> & { ui?: ISystemUserInterface }
  ) {
    this._ui = arg.ui;
    this.arg = {
      appName: APP_NAME,
      interactive: IS_INTERACTIVE,
      force: FORCE,
      silent: SILENT,
      skipCertutilInstall: SKIP_CERTUTIL_INSTALL,
      skipHostsFile: SKIP_HOSTS_FILE,
      ...arg,
      defaultDomainCert: {
        daysUntilExpire: DEFAULT_DOMAIN_CERT_DAYS_UNTIL_EXPIRE,
        signWithDevCa: DEFAULT_DOMAIN_CERT_SIGN_WITH_CA,
        ...arg.defaultDomainCert
      },
      defaultCa: {
        daysUntilExpire: DEFAULT_CA_DAYS_UNTIL_EXPIRE,
        name: DEFAULT_CA_NAME,
        label: DEFAULT_CA_LABEL,
        ...arg.defaultCa
      }
    };
  }
  public get appName(): string {
    return this.arg.appName;
  }
  public get skipCertutilInstall(): boolean {
    return this.arg.skipCertutilInstall;
  }
  public get skipHostsFile(): boolean {
    return this.arg.skipCertutilInstall;
  }
  public get ui(): ISystemUserInterface | undefined {
    return this._ui;
  }
  public get shouldUseHeadlessMode(): boolean {
    return this.arg.interactive && this.arg.defaultDomainCert.signWithDevCa;
  }
  public get isForceModeEnabled(): boolean {
    return this.arg.force;
  }
  public get isSilentModeEnabled(): boolean {
    return this.arg.silent;
  }
  public get isInteractiveModeEnabled(): boolean {
    return this.arg.interactive;
  }
  public get ca(): { defaultDays: number; name: string; label: string } {
    return {
      name: this.arg.defaultCa.name,
      label: this.arg.defaultCa.label,
      defaultDays: this.arg.defaultCa.daysUntilExpire
    };
  }
  public toConfig(): Config {
    const arg: IConfigArg = {
      appName: this.arg.appName
    };
    return new Config(arg);
  }
}

/**
 * @internal
 */
export interface IValidOptions {
  e?: string;
}

/**
 * Options for configuring certin
 * @public
 */
export interface ICertinOptionsArg {
  appName: string;
  interactive: boolean;
  force: boolean;
  silent: boolean;
  /** If `certutil` is not installed already (for updating nss databases; e.g. firefox), do not attempt to install it */
  skipCertutilInstall: boolean;
  /** Do not update your systems host file with the domain name of the certificate */
  skipHostsFile: boolean;
  defaultDomainCert: {
    signWithDevCa: boolean;
    daysUntilExpire: number;
  };
  defaultCa: {
    name: string;
    label: string;
    daysUntilExpire: number;
  };
}
