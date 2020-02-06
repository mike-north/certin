import * as _createDebug from "debug";
import * as isInteractive from "is-interactive";
import * as yargs from "yargs";
import * as execa from "execa";
import * as path from "path";
import addCertCommand from "./commands/cert";
import addCleanCommand from "./commands/clean";
import { readJSONSync } from "fs-extra";

/**
 * Invoke the cli
 * @beta
 */
export function main(_args: string[]): void {
  let program: yargs.Argv<{}> = yargs
    .parserConfiguration({
      "strip-dashed": true,
      "strip-aliased": true
    })
    .env("CERTIN")
    .config("config", function(configPath) {
      return readJSONSync(configPath);
    })
    .pkgConf("certin")
    .option("non-interactive", {
      type: "boolean",
      default: !isInteractive(),
      defaultDescription: "auto-detection",
      description: "run in non-interactive mode"
    })
    .option("force", {
      type: "boolean",
      default: false,
      description: "write over any existing files (i.e., output cert)"
    })
    .option("appName", {
      type: "string",
      default: false,
      hidden: true,
      description: "application name in logging output"
    })
    .option("certutil-install", {
      type: "boolean",
      default: true,
      description:
        "install `certutil` locally (disabling may result in failure)"
    })
    .option("update-hosts-file", {
      type: "boolean",
      default: true,
      description: "automatically update /etc/hosts"
    })
    .option("force", {
      type: "boolean",
      default: false,
      description: "write over any existing files (i.e., output cert)"
    })
    .option("force", {
      type: "boolean",
      default: false,
      description: "write over any existing files (i.e., output cert)"
    })
    .option("silent", {
      type: "boolean",
      default: false,
      description:
        "run in silent mode. all user-facing logging will be redirected to DEBUG"
    });
  program = addCertCommand(program);
  program = addCleanCommand(program);

  program
    .help()
    .showHelpOnFail(true)
    .command("*", false, {}, () => {
      program.showHelp();
      program.exit(1, new Error("unrecognized command"));
    })
    .demandCommand(1, "you must specify which command to invoke")
    .wrap(null).argv;
}

/**
 * Invoke the cli synchronously
 * @beta
 */
export function mainSync(args: string[], opts?: execa.SyncOptions): void {
  if (typeof args === "string")
    throw new Error(
      "args passed to `mainSync` should be an array, not a string"
    );
  execa.sync("node", [path.join(__dirname, "sync.js"), ...args], {
    preferLocal: true,
    ...opts
  });
}
