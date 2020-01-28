import { core } from "..";

QUnit.module("@certutils/core", () => {
  // QUnit.todo("needs tests");
  QUnit.test("export exists", assert => {
    assert.ok(core);
  });
});
