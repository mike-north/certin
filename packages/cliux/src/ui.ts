import * as chalk from "chalk";
import { logPasswordRequestNotice, makeLogger } from "./logging";
import { ILogger, ICliUI } from "@certin/types";

/**
 * @internal
 */
export interface IUIOptions {
  appName: string;
  silent: boolean;
}

const DEFAULT_UI_OPTIONS: IUIOptions = {
  silent: false,
  appName: "cert-in"
};

/**
 * @internal
 */
class UI implements ICliUI {
  protected options: IUIOptions;
  public readonly LOG_PREFIX_TXT: string;
  public readonly LOG_PREFIX: string;
  public readonly WARN_PREFIX: string;
  private _logger: ILogger;
  public constructor(opts: Partial<IUIOptions>) {
    this.options = { ...DEFAULT_UI_OPTIONS, ...opts };
    this.LOG_PREFIX_TXT = `[${this.options.appName.toUpperCase()}]`;
    this.LOG_PREFIX = chalk.white(this.LOG_PREFIX_TXT);
    this.WARN_PREFIX = chalk.yellow.bgBlack("[WARNING]");
    this._logger = makeLogger(this, this.options.silent);
  }

  public logger(): ILogger {
    return this._logger;
  }

  public logPasswordRequestNotice(reason: string): void {
    logPasswordRequestNotice(this, reason);
  }
}

export default UI;
