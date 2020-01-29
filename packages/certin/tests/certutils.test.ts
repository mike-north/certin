import { core } from "..";

QUnit.module("certin", () => {
  QUnit.test("'core' export exists", assert => {
    assert.ok(core);
  });
});
