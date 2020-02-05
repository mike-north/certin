/**
 * @internal
 */
export interface IAlertContent {
  title: string;
  nba: string;
  body: string;
}

/**
 * A loging function, for exposing messages to end users
 * @internal
 */
export interface ILoggerFn {
  (...args: any[]): void;
}

/**
 * A logger, for exposing warnings and informational messages to end users
 * @internal
 */
export interface ILogger {
  log: ILoggerFn;
  warn: ILoggerFn;
}

/**
 * @internal
 */
export interface ICliUI {
  logger(): ILogger;
  logPasswordRequestNotice(reason: string): void;
}
