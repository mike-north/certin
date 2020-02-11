import * as execa from "execa";
import { ERROR_WHILE_SUDOING } from "@certin/messages";

const DEFAULT_SUDO_TEST_FN = (): void => {
  execa.sync("sudo", ["-n", "true"]);
};
/**
 * @internal
 */
export function hasSudo(fn: () => void): boolean;

/**
 * @alpha
 */
export function hasSudo(): boolean;
export function hasSudo(fn = DEFAULT_SUDO_TEST_FN): boolean {
  try {
    fn();
    return true;
  } catch (e) {
    if (
      !(
        e &&
        e.message &&
        typeof e.message === "string" &&
        e.message.trim() === "sudo: a password is required"
      )
    )
      throw new Error(ERROR_WHILE_SUDOING(e));
    return false;
  }
}
