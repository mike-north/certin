/**
 * @internal
 */
export interface AlertContent {
  title: string;
  nba: string;
  body: string;
}

/**
 * A loging function, for exposing messages to end users
 * @internal
 */
export interface LoggerFn {
  (...args: any[]): void;
}

/**
 * A logger, for exposing warnings and informational messages to end users
 * @internal
 */
export interface Logger {
  log: LoggerFn;
  warn: LoggerFn;
}

/**
 * @internal
 */
export interface CliUI {
  logger(): Logger;
  logPasswordRequestNotice(reason: string): void;
}
