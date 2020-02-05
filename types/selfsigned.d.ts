declare namespace selfsigned {
  export function generate(
    atts: any,
    options: any,
  ): { private: string; cert: string };
}

export = selfsigned;
