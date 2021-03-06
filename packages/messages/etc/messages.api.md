## API Report File for "@certin/messages"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { IAlertContent } from '@certin/types';

// Warning: (ae-internal-missing-underscore) The name "ALERT_PERMISSION_REQUIRED" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal
export const ALERT_PERMISSION_REQUIRED: Pick<IAlertContent, "title" | "nba">;

// Warning: (ae-internal-missing-underscore) The name "ASSERT_CERT_EXISTS" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const ASSERT_CERT_EXISTS = "cert content exists";

// Warning: (ae-internal-missing-underscore) The name "ASSERT_CERT_GENERATION_OUTPUT_MISSING" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const ASSERT_CERT_GENERATION_OUTPUT_MISSING: (pemPath: string) => string;

// Warning: (ae-internal-missing-underscore) The name "ASSERT_CERT_IS_NOT_EMPTY" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const ASSERT_CERT_IS_NOT_EMPTY = ".pem file has nonzero size";

// Warning: (ae-internal-missing-underscore) The name "ASSERT_KEY_EXISTS" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const ASSERT_KEY_EXISTS = "key content exists";

// Warning: (ae-internal-missing-underscore) The name "ERROR_WHILE_SUDOING" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const ERROR_WHILE_SUDOING: (err: any) => string;

// Warning: (ae-internal-missing-underscore) The name "LOG_CERT_GENERATION_COMPLETE" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const LOG_CERT_GENERATION_COMPLETE: (subjectName: string) => string;

// Warning: (ae-internal-missing-underscore) The name "LOG_CERT_WROTE_TO_LOCATION" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const LOG_CERT_WROTE_TO_LOCATION: ({ commonName, subjectAltNames, pemPath, certSize }: {
    commonName: string;
    subjectAltNames: string[];
    pemPath: string;
    certSize: number;
}) => string;

// Warning: (ae-internal-missing-underscore) The name "LOG_CLEANING_UP_TRUST_STORE" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const LOG_CLEANING_UP_TRUST_STORE = "Cleaning up any relevant self-signed certificates from your trust store";

// Warning: (ae-internal-missing-underscore) The name "LOG_CREATE_NEW_CERT" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const LOG_CREATE_NEW_CERT: ({ commonName, subjectAltNames }: {
    commonName: string;
    subjectAltNames: string[];
}) => string;

// Warning: (ae-internal-missing-underscore) The name "LOG_EXISTING_CERT_USER_RESPONSE_REQUIRED" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const LOG_EXISTING_CERT_USER_RESPONSE_REQUIRED: (pemPath: string) => string;

// Warning: (ae-internal-missing-underscore) The name "LOG_EXITING_AT_USER_REQUEST" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const LOG_EXITING_AT_USER_REQUEST = "Exiting at user's request";

// Warning: (ae-internal-missing-underscore) The name "LOG_FORCE_MODE_ENABLED" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const LOG_FORCE_MODE_ENABLED = "--force argument detected and an existing cert was found. It will written over";

// Warning: (ae-internal-missing-underscore) The name "LOG_FOUND_EXISTING_CERT" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const LOG_FOUND_EXISTING_CERT: (subjectName: string) => string;

// Warning: (ae-internal-missing-underscore) The name "LOG_NO_EXISTING_CERT_FOUND" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const LOG_NO_EXISTING_CERT_FOUND: (subjectName: string) => string;

// Warning: (ae-internal-missing-underscore) The name "LOG_PROCEEDING_IN_DEV_MODE" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const LOG_PROCEEDING_IN_DEV_MODE = "proceeding with DEVELOPMENT domain cert generation. this cert WILL be signed by a developers self-signed CA";

// Warning: (ae-internal-missing-underscore) The name "LOG_PROCEEDING_IN_HEADLESS_MODE" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const LOG_PROCEEDING_IN_HEADLESS_MODE = "proceeding with HEADLESS domain cert generation. this cert WILL NOT be signed by a developers self-signed CA";

// Warning: (ae-internal-missing-underscore) The name "LOG_SEARCHING_FOR_CERT" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const LOG_SEARCHING_FOR_CERT: (subjectName: string) => string;

// Warning: (ae-internal-missing-underscore) The name "LOG_SUDO_MISSING" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const LOG_SUDO_MISSING = "process is NOT running with sudo. A password from the user is required";

// Warning: (ae-internal-missing-underscore) The name "PROMPT_SHOULD_WE_OVERWRITE_IT" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const PROMPT_SHOULD_WE_OVERWRITE_IT: (pemPath: string) => string;

// Warning: (ae-internal-missing-underscore) The name "SUDO_REASON_CLEAN_TRUST_STORE_PERMISSIONS" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const SUDO_REASON_CLEAN_TRUST_STORE_PERMISSIONS = "we need your permission to access your OS trust store, in order to remove any pertinent self-signed certificates";

// Warning: (ae-internal-missing-underscore) The name "SUDO_REASON_NEW_CERT_PERMISSIONS" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export const SUDO_REASON_NEW_CERT_PERMISSIONS = "we are attempting to set appropriate file permissions on your new cert and private key";


// (No @packageDocumentation comment for this package)

```
