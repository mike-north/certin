/**
 * @alpha
 */
export interface ISystemUserInterface {
  getWindowsEncryptionPassword(): string | Promise<string>;
  warnChromeOnLinuxWithoutCertutil(): void | Promise<void>;
  closeFirefoxBeforeContinuing(): void | Promise<void>;
  startFirefoxWizard(certificateHost: string): void | Promise<void>;
  firefoxWizardPromptPage(certificateURL: string): string | Promise<string>;
  waitForFirefoxWizard(): void | Promise<void>;
}
