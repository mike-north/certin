import * as tmp from "tmp";
export {
  run,
  ExecAsyncOptions,
  ExecSyncOptions,
  ExecaChildProcess
} from "./exec";

export { hasSudo } from "./sudo";
export { isLinux, isWindows, isMac } from "./constants";

/**
 * Given a list of domains, return a list
 * including those domains and the equivalent "wildcard"
 * domains
 *
 * @param list domain names
 *
 * @example
 * ```ts
 * includeWildcards(['foo.com', 'bar.com']); // ['foo.com', '*.foo.com', 'bar.com', '*.bar.com']
 * ```
 * @internal
 */
export function includeWildcards(list: string[]): string[] {
  return list.reduce((outlist, item) => {
    outlist.push(item, `*.${item}`);
    return outlist;
  }, [] as string[]);
}

/**
 * Make a temporary file
 * @internal
 */
export function mkTmpFile(): tmp.SynchrounousResult {
  // discardDescriptor because windows complains the file is in use if we create a tmp file
  // and then shell out to a process that tries to use it
  return tmp.fileSync({ discardDescriptor: true });
}
