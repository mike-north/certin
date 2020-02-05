import { Debugger } from "debug";

export function logArgs<F extends Function>(debug: Debugger, fn: F): F {
  return (function loggingWrapper(...args: any[]): any {
    debug(`${fn.name}(${args.map(a => JSON.stringify(a)).join(", ")})`);
    return fn(...args);
  } as any) as F;
}
