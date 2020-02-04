import * as execa from 'execa';
import { ERROR_WHILE_SUDOING } from './messages';

export function hasSudo(): boolean {
  try {
    execa.shellSync('sudo -n true');
    return true;
  } catch (e) {
    if (!(e && e.stderr.trim() === 'sudo: a password is required'))
      throw new Error(ERROR_WHILE_SUDOING(e));
    return false;
  }
}
