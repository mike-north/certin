import { main } from "@certin/cli";

QUnit.module("@certin/cli", () => {
  QUnit.test("needs tests", assert => {
    assert.ok(main);
  });
});
