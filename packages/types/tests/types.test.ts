import { ExtractArgs } from "@certin/types";

QUnit.module("@certin/types", () => {
  QUnit.test("needs tests", assert => {
    let x: ExtractArgs<typeof QUnit["test"]>[0];
    x = "3";
    x = "4";
    if (typeof x !== "string") {
      const y: never = x;
    }
    assert.ok(true);
  });
});
