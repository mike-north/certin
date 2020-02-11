import { logArgs } from "../src/logging";

QUnit.module("exec tests", () => {
  QUnit.test("run", assert => {
    assert.ok(logArgs);
  });
});
