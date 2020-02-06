import { Config } from "@certin/config";
import * as createDebug from "debug";
import * as path from "path";
import sudoPrompt from "sudo-prompt";
import * as tmp from "tmp";
import * as execa from "execa";

// import { configPath } from "./constants";

const debug = createDebug("certin:util");

function run(
  cmd: string,
  args: string[],
  options: execa.SyncOptions = {}
): execa.ExecaReturns {
  debug(`exec: \`${cmd}\``);
  return execa.sync(cmd, args, options);
}

function openssl(config: Config, args: string[]): string {
  return run("openssl", args, {
    stdio: "pipe",
    env: Object.assign(
      {
        RANDFILE: path.join(config.getConfigPath(".rnd"))
      },
      process.env
    )
  }).toString();
}

function waitForUser(): Promise<void> {
  return new Promise(resolve => {
    process.stdin.resume();
    process.stdin.on("data", resolve);
  });
}

function reportableError(message: string): Error {
  return new Error(
    `${message} | This is a bug in certin, please report the issue at https://github.com/mike-north/certin/issues`
  );
}

function mktmp(): string {
  // discardDescriptor because windows complains the file is in use if we create a tmp file
  // and then shell out to a process that tries to use it
  return tmp.fileSync({ discardDescriptor: true }).name;
}
