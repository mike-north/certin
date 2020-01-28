import { core } from "..";

QUnit.module("certutils", () => {
  QUnit.test("'core' export exists", assert => {
    assert.ok(core);
  });
});
