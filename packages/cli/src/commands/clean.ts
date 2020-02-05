import * as yargs from "yargs";
import * as _createDebug from "debug";
import { assertIsBoolean } from "../validation";
import { cleanupTrustStore, Workspace } from "@certin/core";
import { UI, IUIOptions } from "@certin/cliux";

const debug = _createDebug("pemberly-secure:cli:cert");

function addCleanCommand(y: yargs.Argv<{}>): yargs.Argv<{}> {
  return y.command(
    "clean",
    "clean any generated self-signed certs from the trust store",
    {},
    argv => {
      debug("[clean] running command", argv);
      const { nonInteractive, force, silent } = argv as any;
      assertIsBoolean(silent, "silent");
      const opts: Partial<IUIOptions> = { silent };
      if (process.env["CERTIN_APP_NAME"]) {
        opts.appName = process.env["CERTIN_APP_NAME"];
      }
      assertIsBoolean(force, "force");
      assertIsBoolean(silent, "silent");
      assertIsBoolean(nonInteractive, "non-interactive");
      const ui = new UI(opts);
      const workspace = new Workspace({
        ux: {
          forceMode: force,
          silentMode: silent,
          interactiveMode: !nonInteractive
        }
      });
      cleanupTrustStore(ui, workspace);
      debug("[clean] completed execution", argv);
    }
  );
}

export default addCleanCommand;
