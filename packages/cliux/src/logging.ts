/* eslint-disable no-console, @typescript-eslint/unbound-method */
import * as chalk from "chalk";
import * as boxen from "boxen";
import * as termSize from "term-size";
import * as wordWrap from "word-wrap";

import * as _createDebug from "debug";
import { ALERT_PERMISSION_REQUIRED } from "./messages";
import UI from "./ui";

// const appName = process.env["CERTIN_APP_NAME"] || "certin";

const debug = _createDebug("certin");

// CONSTANTS
const BOX_PADDING = 1;
const BOX_MARGIN = 0;

const BOX_WIDTH_MAX = 80;
const BOX_WIDTH = Math.min(BOX_WIDTH_MAX, termSize().columns);

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
 * @public
 */
export interface LoggerFn {
  (...args: any[]): void;
}

/**
 * A logger, for exposing warnings and informational messages to end users
 * @public
 */
export interface Logger {
  log: LoggerFn;
  warn: LoggerFn;
}

/**
 * Log a user-visible message to the console
 * @param msg console.log arguments
 * @internal
 */
const makeLoggerLogFn = (ui: UI, silentMode: boolean) => (
  ...msg: any[]
): void =>
  (silentMode ? debug : console.log)(`${ui.LOG_PREFIX}: `, msg.join(" "));

/**
 * Log a user-visible message to the console
 * @param msg console.log arguments
 * @internal
 */
const makeWarnerLogFn = (ui: UI, silentMode: boolean) => (
  ...msg: any[]
): void =>
  (silentMode ? debug : console.warn)(
    `${ui.LOG_PREFIX}${ui.WARN_PREFIX}: `,
    ...msg
  );

/**
 *
 * @param silent silent mode (no user-visible messages, other than errors)
 * @internal
 */
export const makeLogger = (ui: UI, silent: boolean): Logger => ({
  log: makeLoggerLogFn(ui, silent),
  warn: makeWarnerLogFn(ui, silent)
});

function makeConsoleAlert(ui: UI, alertContent: AlertContent): string {
  const { title, nba, body } = alertContent;
  return boxen(
    `${chalk.yellowBright(ui.LOG_PREFIX_TXT)}
${chalk.bold(wordWrap(title, { width: BOX_WIDTH - 10 }))}

${chalk.dim(wordWrap(body, { width: BOX_WIDTH - 10 }))}

${chalk.blueBright(wordWrap(nba, { width: BOX_WIDTH - 10 }))}`,
    {
      padding: BOX_PADDING,
      margin: BOX_MARGIN,
      align: "center",
      borderColor: "yellow"
    }
  );
}

/**
 * Print a console alert to the screen
 * @param alertContent alertContent
 */
function consoleAlert(ui: UI, alertContent: AlertContent): void {
  console.log(makeConsoleAlert(ui, alertContent));
}

/**
 * Log a notice describing why we need the user's password
 * @param reason - a description of why we need the user's password
 * @private
 */
export function logPasswordRequestNotice(ui: UI, reason: string): void {
  consoleAlert(ui, { ...ALERT_PERMISSION_REQUIRED, body: reason });
}
