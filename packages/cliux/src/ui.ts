import * as chalk from "chalk";
import { logPasswordRequestNotice, makeLogger } from "./logging";
import { Logger, CliUI } from "@certin/types";

/**
 * @internal
 */
export interface UIOptions {
  appName: string;
  silent: boolean;
}

const DEFAULT_UI_OPTIONS: UIOptions = {
  silent: false,
  appName: "cert-in"
};

/**
 * @internal
 */
class UI implements CliUI {
  protected options: UIOptions;
  public readonly LOG_PREFIX_TXT: string;
  public readonly LOG_PREFIX: string;
  public readonly WARN_PREFIX: string;
  private _logger: Logger;
  public constructor(opts: Partial<UIOptions>) {
    this.options = { ...DEFAULT_UI_OPTIONS, ...opts };
    this.LOG_PREFIX_TXT = `[${this.options.appName.toUpperCase()}]`;
    this.LOG_PREFIX = chalk.white(this.LOG_PREFIX_TXT);
    this.WARN_PREFIX = chalk.yellow.bgBlack("[WARNING]");
    this._logger = makeLogger(this, this.options.silent);
  }

  public logger(): Logger {
    return this._logger;
  }

  public logPasswordRequestNotice(reason: string): void {
    logPasswordRequestNotice(this, reason);
  }
}

export default UI;
