import { createConfig } from "@certin/config";

QUnit.module("@certin/config", () => {
  QUnit.test("needs tests", assert => {
    assert.equal(typeof createConfig, "function");
  });
});
