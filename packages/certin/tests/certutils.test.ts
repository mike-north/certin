import { certificateFor } from "certin";

QUnit.module("certin", () => {
  QUnit.test("'certificateFor' export exists", assert => {
    assert.ok(certificateFor);
  });
});
