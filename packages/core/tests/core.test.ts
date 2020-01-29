import { core } from "..";

QUnit.module("@certin/core", () => {
  // QUnit.todo("needs tests");
  QUnit.test("export exists", assert => {
    assert.ok(core);
  });
});
