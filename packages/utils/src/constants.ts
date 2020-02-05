import applicationConfigPath = require("application-config-path");

////////////////////////////////////////////////
// Platform shortcuts
////////////////////////////////////////////////
/**
 * @public
 */
export const isMac = process.platform === "darwin";
/**
 * @public
 */
export const isLinux = process.platform === "linux";
/**
 * @public
 */
export const isWindows = process.platform === "win32";
