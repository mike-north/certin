import { run } from "@certin/utils";

QUnit.module("@certin/utils", () => {
  QUnit.test("needs tests", assert => {
    assert.equal(typeof run, "function");
  });
});
