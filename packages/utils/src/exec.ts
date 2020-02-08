import * as execa from "execa";
import * as path from "path";
import * as _createDebug from "debug";
import { logArgs } from "./logging";
import { ExtractArgs } from "@mike-north/types";
import * as sudoPrompt from "sudo-prompt";

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

function _runImpl(
  cmd: string,
  args: string[],
  options: Partial<ExecSyncOptions> = {}
): ExecaChildProcess {
  return execa(cmd, args, options);
}

const runImpl = logArgs(debug, _runImpl);

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

async function _sudoImpl(
  appName: string,
  cmd: string,
  args: string[]
): Promise<string | null> {
  // return new Promise((resolve, reject) => {
  // const toRun = [cmd, ...args].join(" ");
  return (await runImpl("sudo", [cmd, ...args])).stdout;
  //   sudoPrompt.exec(
  //     toRun,
  //     { name: appName },
  //     (err: Error | null, stdout: string | null, stderr: string | null) => {
  //       const error =
  //         err ||
  //         (typeof stderr === "string" &&
  //           stderr.trim().length > 0 &&
  //           new Error(stderr));

  //       if (error) {
  //         reject(error);
  //       } else {
  //         resolve(stdout);
  //       }
  //     }
  //   );
  // });
}

const sudoImpl = logArgs(debug, _sudoImpl);

/**
 * Run a command as `sudo`
 * @param cmd command to run as sudo
 * @internal
 */
export function sudo(
  appName: string,
  cmd: string,
  args: string[]
): Promise<string | null> {
  return sudoImpl(appName, cmd, args);
}

/**
 *
 * @param configPath path to app configuration (i.e., ~/.config)
 * @param args args to pass to openssl CLI
 * @internal
 */
export async function openssl(
  configPath: string,
  args: string[]
): Promise<string> {
  const result = await execa("openssl", [...args], {
    stdio: "inherit",
    env: Object.assign(
      {
        RANDFILE: path.join(configPath, ".rnd")
      },
      process.env
    )
  });
  return result.toString();
}
