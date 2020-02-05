import * as execa from "execa";
import * as _createDebug from "debug";
import { logArgs } from "./logging";
import { ExtractArgs } from "@mike-north/types";

const debug = _createDebug("certin:utils:exec");

/** @internal */
export type ExecAsyncOptions = Exclude<ExtractArgs<typeof execa>[2], undefined>;
/** @internal */
export type ExecSyncOptions = Exclude<
  ExtractArgs<typeof execa.sync>[2],
  undefined
>;
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
