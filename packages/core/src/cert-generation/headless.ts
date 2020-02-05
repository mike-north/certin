import * as selfsigned from "selfsigned";
import { ICliUI } from "@certin/types";
import Workspace from "../workspace";

export function ensureHeadlessCertExists(
  workspace: Workspace,
  subjectName: string,
  _ui: ICliUI
): { key: string; cert: string } {
  const attrs = [{ name: "commonName", value: subjectName }];
  const pems = selfsigned.generate(attrs, {
    days: 2,
    algorithm: "sha256",
    keySize: 2048,
    extensions: [
      {
        name: "basicConstraints",
        cA: false
      },
      {
        name: "keyUsage",
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
      },
      {
        name: "extKeyUsage",
        serverAuth: true,
        clientAuth: true
      },
      {
        name: "subjectAltName",
        altNames: [
          subjectName,
          ...workspace.cfg.options.domainCert.subjectAltNames
        ]
          .reduce((list, item) => {
            list.push(item, `*.${item}`);
            return list;
          }, [] as string[])
          .map(value => ({
            type: 2, // type 2 is DNS
            value
          }))
      }
    ]
  });
  return { key: pems.private, cert: pems.cert };
}
