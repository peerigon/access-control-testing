import { RequestAuthenticator } from "./authenticator.ts";
import { SessionManager } from "./session-manager.ts";
import {
  AuthenticationCredentials,
  CookieAuthSession,
  RequestOptions,
} from "./types.ts";

export class CookieAuthenticator
  extends SessionManager<CookieAuthSession>
  implements RequestAuthenticator
{
  protected async initializeSession(credentials: AuthenticationCredentials) {
    console.debug("init new cookie session");
    const { response, cookieJar, authResponseParameterDescription } =
      await this.obtainSession(credentials);

    const { parameterName: cookieParameterName } =
      authResponseParameterDescription;

    // todo: make base url configurable as param
    // read the value from a config prop or the OpenAPI spec

    // todo: make this configurable
    // todo: clarify if STORE_ALL_COOKIES mode could help with csrf protection set
    const STORE_ALL_COOKIES = true;
    let session: CookieAuthSession;

    if (STORE_ALL_COOKIES) {
      // todo: maybe store cookies as an object map instead of an array
      session = {
        cookies: cookieJar,
        // maybe also include information about session-relevant cookie name
      };
      this.sessionStore.set(credentials.identifier, session);
    } else {
      // todo: this is not supported currently
      const cookie = response.cookie(cookieParameterName);
      if (!cookie) {
        // todo: add error handling
        throw new Error(
          "No cookie found in server response for the login endpoint",
        );
      }

      // todo: add error handling

      // todo: if token expiry is not defined in response (in our case token.expiresAt), read out token to store this extra piece of information

      // todo: get expiry from maxAge?
      /* session = {
        cookies: [
          {
            name: cookieParameterName,
            value: cookie.value,
          },
        ],
        expiresAt: cookie.expires,
      };*/
    }

    return session;
  }

  public async authenticateRequest(
    requestOptions: RequestOptions,
    credentials: AuthenticationCredentials,
  ) {
    const session = await this.findOrInitializeSession(credentials);

    if (!session?.cookies) {
      throw new Error("Could not initialize session with cookies");
    }

    requestOptions.cookieJar = session.cookies;
  }
}
