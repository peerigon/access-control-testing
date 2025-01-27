import { RequestAuthenticator } from "./http/authenticator";
import { BasicAuthenticator } from "./http/basic-authenticator";
import { BearerAuthenticator } from "./http/bearer-authenticator";
import { CookieAuthenticator } from "./http/cookie-authenticator";
import { AuthenticatorType } from "./http/types";

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
