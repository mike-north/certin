import { cli } from "..";

QUnit.module("@certin/cli", () => {
  QUnit.test("needs tests", assert => {
    assert.ok(cli);
  });
});
