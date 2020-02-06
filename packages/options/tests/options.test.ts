import { Options } from "@certin/options";

QUnit.module("@certin/options", () => {
  QUnit.test("needs tests", assert => {
    assert.equal(typeof Options, "function");
  });
});
