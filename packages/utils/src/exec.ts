import * as execa from "execa";
import * as _createDebug from "debug";
import { logArgs } from "./logging";
import { _ExtractArg3 } from "./types";

const debug = _createDebug("certin:utils:exec");

/** @internal */
export type ExecAsyncOptions = _ExtractArg3<typeof execa>;
/** @internal */
export type ExecSyncOptions = _ExtractArg3<typeof execa.sync>;
/** @internal */
export type ExecaChildProcess = ReturnType<typeof execa>;

const runImpl = logArgs(debug, function runImpl(
  cmd: string,
  args: string[],
  options: Partial<ExecSyncOptions> = {}
): ExecaChildProcess {
  return execa(cmd, args, options);
});

/**
 *
 * @param cmd
 * @param options
 *
 * @internal
 */
export function run(
  cmd: string,
  args: string[],
  options: Partial<ExecSyncOptions> = {}
): ExecaChildProcess {
  return runImpl(cmd, args, options);
}
