import {
  assertIsArray,
  assertIsBoolean,
  assertIsFQDN,
  assertIsInteger,
  assertIsNumber,
  assertIsPositiveInteger,
  assertIsString
} from "@certin/utils";

QUnit.module("assertions", () => {
  QUnit.test("assertIsArray", assert => {
    assertIsArray([]);
    assert.ok(true, "[]");

    assertIsArray(["foo"]);
    assert.ok(true, '["foo"]');

    assert.throws(() => {
      assertIsArray({});
    }, "{}");
  });
  QUnit.test("assertIsBoolean", assert => {
    assertIsBoolean(true, "true");
    assert.ok(true, "true");

    assertIsBoolean(false, "false");
    assert.ok(true, "false");

    assert.throws(() => {
      assertIsBoolean({}, "empty object");
    }, "{}");
  });
  QUnit.test("assertIsInteger", assert => {
    assertIsInteger(3, "3");
    assert.ok(true, "3");

    assertIsInteger(-4, "-4");
    assert.ok(true, "-4");

    assert.throws(() => {
      assertIsInteger("foo", "foo");
    }, "foo");
  });
  QUnit.test("assertIsString", assert => {
    assertIsString("123", "'123'");
    assert.ok(true, "'123'");

    assert.throws(() => {
      assertIsString(-12, "-12");
    }, "-12");
  });
  QUnit.test("assertIsNumber", assert => {
    assertIsNumber(3, "3");
    assert.ok(true, "3");

    assertIsNumber(-4.4, "-4.4");
    assert.ok(true, "-4.4");

    assert.throws(() => {
      assertIsNumber("14", "'14");
    }, "'14'");
  });
  QUnit.test("assertIsPositiveInteger", assert => {
    assertIsPositiveInteger(3, "3");
    assert.ok(true, "3");

    assertIsPositiveInteger(0, "0");
    assert.ok(true, "0");

    assert.throws(() => {
      assertIsPositiveInteger(-12, "-12");
    }, "-12");

    assert.throws(() => {
      assertIsPositiveInteger(-12, "-12");
    }, "-12");
  });
  QUnit.test("assertIsFQDN", assert => {
    assertIsFQDN("example.com", "example.com");
    assert.ok(true, "example.com");

    assert.throws(() => {
      assertIsFQDN("abc", "abc");
    }, "{}");
  });
});
