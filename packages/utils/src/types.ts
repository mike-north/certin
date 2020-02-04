/**
 * @internal
 */
export type _ExtractArg3<F> = F extends (
  _a: any,
  _b: any,
  c: Partial<infer T>
) => any
  ? T
  : never;
