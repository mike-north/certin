import { ensureCertExists } from "certin";

QUnit.module("certin", () => {
  QUnit.test("'ensureCertExists' export exists", assert => {
    assert.ok(ensureCertExists);
  });
});
