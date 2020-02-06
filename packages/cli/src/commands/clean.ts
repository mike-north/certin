import * as yargs from "yargs";
import * as _createDebug from "debug";
import { assertIsBoolean, assertIsString } from "@certin/utils";
import { cleanupTrustStore, Workspace } from "@certin/core";
import { UI, IUIOptions } from "@certin/cliux";
import { camelCase } from "camel-case";
import { titleCase } from "title-case";
const debug = _createDebug("certin:cli:cert");

function addCleanCommand(y: yargs.Argv<{}>): yargs.Argv<{}> {
  return y.command(
    "clean",
    "clean any generated self-signed certs from the trust store",
    {},
    argv => {
      debug("[clean] running command", argv);
      const {
        nonInteractive,
        force,
        silent,
        appName,
        certutilInstall,
        updateHostsFile
      } = argv as any;
      assertIsBoolean(silent, "silent");
      const opts: Partial<IUIOptions> = { silent };

      assertIsString(appName, "appName");
      assertIsBoolean(silent, "silent");
      assertIsBoolean(nonInteractive, "non-interactive");
      assertIsBoolean(certutilInstall, "certutil-install");
      assertIsBoolean(updateHostsFile, "update-hosts-file");
      const ui = new UI(opts);
      const workspace = new Workspace({
        force: force,
        silent: silent,
        interactive: !nonInteractive,
        appName,
        skipCertutilInstall: !certutilInstall,
        skipHostsFile: !updateHostsFile,
        defaultCa: {
          label: camelCase(appName),
          name: titleCase(appName),
          daysUntilExpire: 180
        },
        defaultDomainCert: {
          daysUntilExpire: 30,
          signWithDevCa: true
        }
      });
      cleanupTrustStore(ui, workspace);
      debug("[clean] completed execution", argv);
    }
  );
}

export default addCleanCommand;
