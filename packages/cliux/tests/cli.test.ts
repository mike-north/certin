import { cli } from "../src/index";

QUnit.module("@certin/cli", () => {
  QUnit.test("needs tests", assert => {
    assert.ok(cli);
  });
});
