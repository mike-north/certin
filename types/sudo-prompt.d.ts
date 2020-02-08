declare namespace sudoPrompt {
  interface IOptions {
    name: string;
  }
  export function exec(
    cmd: string,
    opts: IOptions,
    cb: (
      err: Error | null,
      stdout: string | null,
      stderr: string | null
    ) => void
  ): void;
}

export = sudoPrompt;
