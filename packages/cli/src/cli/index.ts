import * as _createDebug from "debug";
import * as isInteractive from "is-interactive";
import * as yargs from "yargs";
import addCertCommand from "./commands/cert";
import addCleanCommand from "./commands/clean";
import { readJSONSync } from "fs-extra";

// const debug = _createDebug('pemberly-secure:cli');

export function main(_args: string[]): void {
  let program: yargs.Argv<{}> = yargs
    .parserConfiguration({
      "strip-dashed": true,
      "strip-aliased": true
    })
    .env("PEMBERLY_SECURE")
    .config("config", function(configPath) {
      return readJSONSync(configPath);
    })
    .pkgConf("pemberly-secure")
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
