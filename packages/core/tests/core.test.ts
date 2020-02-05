import { ensureCertExists } from "@certin/core";

QUnit.module("@certin/core", () => {
  QUnit.test("exports exist", assert => {
    assert.ok(ensureCertExists, "ensureCertExists exists");
  });
});
