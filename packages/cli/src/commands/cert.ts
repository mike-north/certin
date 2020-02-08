import * as yargs from "yargs";
import * as CI from "is-ci";
import * as _createDebug from "debug";
import { join } from "path";
import {
  assertIsFQDN,
  assertIsPositiveInteger,
  assertIsBoolean,
  assertIsString,
  assertIsArray
} from "@certin/utils";
import { ensureCertExists, Workspace } from "@certin/core";
import chalk = require("chalk");
import { existsSync } from "fs-extra";
import { UI, IUIOptions } from "@certin/cliux";
import { camelCase } from "camel-case";
import { titleCase } from "title-case";

const debug = _createDebug("certin:cli:cert");

function addCertCommand(y: yargs.Argv<{}>): yargs.Argv<{}> {
  return y.command(
    "cert [name]",
    "generate an x509 cert",
    yarg => {
      yarg
        .positional("name", {
          describe: "subject name for certificate"
        })
        .demandOption(
          "name",
          "you must specify a subject name for this certificate. Usually this is the domain name used for https:// "
        )
        .option("out", {
          describe: "output location for the certificate",
          default: "out.pem"
        })
        .option("ca-days", {
          describe:
            "lifetime of certificate authority (if one ends up being created) in days",
          default: 180
        })
        .option("cert-days", {
          describe: "lifetime of domain certificate in days",
          default: 30
        })
        .demandOption("out", "you must specify an output path")

        .option("san", {
          type: "array",
          default: [],
          defaultDescription: "no alternate names",
          description:
            "alternate domain names that the cert can be used with (see: https://en.wikipedia.org/wiki/Subject_Alternative_Name )"
        })
        .option("sign-with-dev-ca", {
          type: "boolean",
          default: !CI,
          defaultDescription: "auto-detection",
          description: "sign the cert w/ a pre-trusted development CA"
        });
    },
    argv => {
      const {
        name,
        certDays,
        san,
        caDays,
        signWithDevCa,
        out,
        nonInteractive,
        force,
        silent,
        appName,
        certutilInstall,
        updateHostsFile
      } = argv as any;

      (async function asyncFn(): Promise<void> {
        debug("[generate-cert] running command", argv);
        assertIsFQDN(name, "subject name");
        assertIsArray(san);
        const filteredSan: string[] = [];
        for (let i = 0; i < san.length; i++) {
          const an = san[i];
          assertIsFQDN(an, `alt name [${i}]`);
          filteredSan.push(an);
        }
        assertIsPositiveInteger(certDays, "certDays");
        assertIsPositiveInteger(caDays, "caDays");
        assertIsBoolean(force, "force");
        assertIsBoolean(silent, "silent");
        assertIsBoolean(signWithDevCa, "signWithDevCa");
        assertIsBoolean(nonInteractive, "non-interactive");
        assertIsString(out, "out");
        const certParentFolderPath = join(out, "..");
        const opts: Partial<IUIOptions> = { silent, appName };

        const ui = new UI(opts);

        if (!existsSync(certParentFolderPath)) {
          ui.logger().warn(
            `folder in which cert will be placed (${chalk.bold(
              certParentFolderPath
            )}) does not yet exist`
          );
        }
        debug(
          "[generate-cert] validated all arguments for command. proceeding with execution"
        );

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
            daysUntilExpire: caDays
          },
          defaultDomainCert: {
            daysUntilExpire: certDays,
            signWithDevCa
          }
        });
        await ensureCertExists(
          workspace,
          { pemPath: out, cli: ui },
          { commonName: name, subjectAltNames: san }
        );
        debug("[generate-cert] completed execution");
      })().catch(err => {
        console.error(`Encountered problem in async command execution\n${err}`);
      });
    }
  );
}

export default addCertCommand;
