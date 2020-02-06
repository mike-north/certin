import { Config } from "@certin/config";

QUnit.module("@certin/config", () => {
  QUnit.test("needs tests", assert => {
    assert.equal(typeof Config, "function");
  });
});
