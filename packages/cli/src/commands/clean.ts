import * as yargs from "yargs";
import * as _createDebug from "debug";
import { assertIsBoolean } from "../validation";
import { cleanupTrustStore } from "@certin/core";
import { UI, UIOptions } from "@certin/cliux";

const debug = _createDebug("pemberly-secure:cli:cert");

function addCleanCommand(y: yargs.Argv<{}>): yargs.Argv<{}> {
  return y.command(
    "clean",
    "clean any generated self-signed certs from the trust store",
    {},
    argv => {
      debug("[clean] running command", argv);
      const { silent } = (argv as any) as { silent: boolean };
      assertIsBoolean(silent, "silent");
      const opts: Partial<UIOptions> = { silent };
      if (process.env["CERTIN_APP_NAME"]) {
        opts.appName = process.env["CERTIN_APP_NAME"];
      }
      const ui = new UI(opts);

      cleanupTrustStore(ui);
      debug("[clean] completed execution", argv);
    }
  );
}

export default addCleanCommand;
