import { ALERT_PERMISSION_REQUIRED } from "@certin/messages";

QUnit.module("@certin/messages", () => {
  QUnit.test("needs tests", assert => {
    assert.ok(ALERT_PERMISSION_REQUIRED);
  });
});
