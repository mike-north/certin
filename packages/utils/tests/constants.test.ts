import { isLinux, isMac, isWindows } from "@certin/utils";

QUnit.module("constants", () => {
  QUnit.test("isMac, isLinux, isWindows", assert => {
    assert.equal(typeof isMac, "boolean", "isMac is a boolean");
    assert.equal(typeof isLinux, "boolean", "isLinux is a boolean");
    assert.equal(typeof isWindows, "boolean", "isWindows is a boolean");
  });
});
