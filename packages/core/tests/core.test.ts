import { certificateFor } from "@certin/core";

QUnit.module("@certin/core", () => {
  QUnit.test("exports exist", assert => {
    assert.ok(certificateFor, "certificateFor exists");
  });
});
