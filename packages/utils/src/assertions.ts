import validator from "validator";

/**
 * Test whether a value is a string, and throw an informative error if it's not
 * @param arg value to test
 * @param label description of the value
 * @public
 */
export function assertIsString(
  arg: unknown,
  label: string
): asserts arg is string {
  if (typeof arg !== "string")
    throw new Error(
      `expected ${label} to be a string. Found: ${JSON.stringify(arg)}`
    );
}

/**
 * Test whether a value is a number, and throw an informative error if it's not
 * @param arg value to test
 * @param label description of the value
 * @public
 */
export function assertIsNumber(
  arg: unknown,
  label: string
): asserts arg is number {
  if (typeof arg !== "number")
    throw new Error(
      `expected ${label} to be a number. Found: ${JSON.stringify(arg)}`
    );
}

/**
 * Test whether a value is an integer, and throw an informative error if it's not
 * @param arg value to test
 * @param label description of the value
 * @public
 */
export function assertIsInteger(
  arg: unknown,
  label: string
): asserts arg is number {
  assertIsNumber(arg, label);
  if (arg !== parseInt("" + arg))
    throw new Error(
      `expected ${label} to be an integer. Found: ${JSON.stringify(arg)}`
    );
}

/**
 * Test whether a value is a positive integer, and throw an informative error if it's not
 * @param arg value to test
 * @param label description of the value
 * @public
 */
export function assertIsPositiveInteger(
  arg: unknown,
  label: string
): asserts arg is number {
  assertIsInteger(arg, label);
  if (arg < 0)
    throw new Error(
      `expected ${label} to be >= 0. Found: ${JSON.stringify(arg)}`
    );
}

/**
 * Test whether a value is a boolean, and throw an informative error if it's not
 * @param arg value to test
 * @param label description of the value
 * @public
 */
export function assertIsBoolean(
  arg: unknown,
  label: string
): asserts arg is boolean {
  if (typeof arg !== "boolean")
    throw new Error(
      `expected ${label} to be a boolean. Found: ${JSON.stringify(arg)}`
    );
}

/**
 * Test whether a value is an array, and throw an informative error if it's not
 * @param arg value to test
 * @param label description of the value
 * @public
 */
export function assertIsArray(arg: unknown): asserts arg is any[] {
  if (Array.isArray(arg)) return;
  throw new Error(`expected ${JSON.stringify(arg)} to be an array`);
}

/**
 * Test whether a value is a FQDN, and throw an informative error if it's not
 * @param arg value to test
 * @param label description of the value
 * @public
 */
export function assertIsFQDN(
  arg: unknown,
  label: string
): asserts arg is string {
  assertIsString(arg, label);
  if (!validator.isFQDN(arg))
    throw new Error(
      `Expected ${label} to be a fully-qualified domain name (FQDN). Found: ${JSON.stringify(
        arg
      )}`
    );
}
