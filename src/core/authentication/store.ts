import { HttpAuthenticator } from "./http/authenticator";
import { BasicAuthenticator } from "./http/basic";
import { BearerAuthenticator } from "./http/bearer";
import { CookieAuthenticator } from "./http/cookie";
import { AuthenticatorType } from "./http/types";

export class AuthenticationStore {
  static authenticatorStore: Record<
    AuthenticatorType,
    HttpAuthenticator | null
  > = {
    [AuthenticatorType.HTTP_BEARER]: null,
    [AuthenticatorType.HTTP_BASIC]: null,
    [AuthenticatorType.API_KEY_COOKIE]: null,
    [AuthenticatorType.NONE]: null, // todo: remove this
  };

  static getOrCreateAuthenticator(
    authenticatorType: AuthenticatorType,
    authEndpoint?: any, // todo: add correct type
  ) {
    if (authenticatorType === AuthenticatorType.NONE) {
      return null;
    }

    const authenticatorAlreadyExists =
      this.authenticatorStore[authenticatorType] !== null;

    if (!authenticatorAlreadyExists) {
      switch (authenticatorType) {
        case AuthenticatorType.HTTP_BEARER:
          this.authenticatorStore[authenticatorType] = new BearerAuthenticator(
            authEndpoint,
          );
          break;
        case AuthenticatorType.HTTP_BASIC:
          this.authenticatorStore[authenticatorType] = new BasicAuthenticator();
          break;
        case AuthenticatorType.API_KEY_COOKIE:
          this.authenticatorStore[authenticatorType] = new CookieAuthenticator(
            authEndpoint,
          );
          break;
      }
    }

    return this.authenticatorStore[authenticatorType];
  }
}
