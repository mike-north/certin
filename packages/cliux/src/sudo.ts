import * as execa from "execa";
import { ERROR_WHILE_SUDOING } from "@certin/messages";

/**
 * @internal
 */
export function hasSudo(): boolean {
  try {
    execa.sync("sudo", ["-n", "true"]);
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
