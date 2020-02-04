declare namespace certInfo {
  export function info(
    content: string,
  ): {
    subject: string;
    altnames: string[];
    issuedAt: number;
    expiresAt: number;
  };
}

export = certInfo;
