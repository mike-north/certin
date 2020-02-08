import { Debugger } from "debug";

export function logArgs<F extends Function>(debug: Debugger, fn: F): F {
  return (function loggingWrapper(...args: any[]): any {
    function handleError(err: unknown): never {
      const e = new Error(
        `Encountered problem while invoking a logged function.\nFUNCTION NAME: ${
          fn.name
        }\nARGUMENTS: ${JSON.stringify(args)}\nERROR: ${err}`
      );
      throw e;
    }
    debug(`${fn.name}(${args.map(a => JSON.stringify(a)).join(", ")})`);
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        result.catch(handleError);
      }
      return result;
    } catch (err) {
      handleError(err);
    }
  } as any) as F;
}
