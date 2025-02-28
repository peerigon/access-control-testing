import type { AuthEndpointInformation } from "../types.js";
import { RequestAuthenticator } from "./http/authenticator.ts";
import { BasicAuthenticator } from "./http/basic-authenticator.ts";
import { BearerAuthenticator } from "./http/bearer-authenticator.ts";
import { CookieAuthenticator } from "./http/cookie-authenticator.ts";
import { AuthenticatorType } from "./http/types.ts";

export class AuthenticationStore {
  static authenticatorStore: Record<
    AuthenticatorType,
    RequestAuthenticator | null
  > = {
    [AuthenticatorType.HTTP_BEARER]: null,
    [AuthenticatorType.HTTP_BASIC]: null,
    [AuthenticatorType.API_KEY_COOKIE]: null,
    [AuthenticatorType.NONE]: null, // todo: remove this
  };

  // todo: authEndpoint required for bearer/cookie
  static getOrCreateAuthenticator(
    authenticatorType: AuthenticatorType,
    apiBaseUrl: string,
    authEndpoint?: AuthEndpointInformation | null,
  ) {
    if (authenticatorType === AuthenticatorType.NONE) {
      return null;
    }

    const authenticatorAlreadyExists =
      this.authenticatorStore[authenticatorType] !== null;

    if (!authenticatorAlreadyExists) {
      switch (authenticatorType) {
        case AuthenticatorType.HTTP_BEARER: {
          if (!authEndpoint) {
            throw new Error(
              "No auth endpoint information available but required for BearerAuthenticator",
            );
          }
          this.authenticatorStore[authenticatorType] = new BearerAuthenticator(
            authEndpoint,
            apiBaseUrl,
          );
          break;
        }
        case AuthenticatorType.HTTP_BASIC: {
          this.authenticatorStore[authenticatorType] = new BasicAuthenticator();
          break;
        }
        case AuthenticatorType.API_KEY_COOKIE: {
          if (!authEndpoint) {
            throw new Error(
              "No auth endpoint information available but required for CookieAuthenticator",
            );
          }
          this.authenticatorStore[authenticatorType] = new CookieAuthenticator(
            authEndpoint,
            apiBaseUrl,
          );
          break;
        }
      }
    }

    return this.authenticatorStore[authenticatorType];
  }
}
