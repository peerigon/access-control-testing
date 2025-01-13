import { ApiRequest } from "@japa/api-client/build/src/request";
import { RequestAuthenticator } from "./authenticator";
import { SessionManager } from "./session-manager";
import { AuthenticationCredentials, CookieAuthSession } from "./types";

export class CookieAuthenticator
  extends SessionManager<CookieAuthSession>
  implements RequestAuthenticator
{
  protected async initializeSession(credentials: AuthenticationCredentials) {
    console.log("init new cookie session");
    const { response, authResponseParameterDescription } =
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
        cookies: Object.values(response.cookies()).map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        })),
        // todo: maybe include expiration and other provided information too?
        // expiresAt: cookie.expires, // store expiry of auth cookie
      };
      this.sessionStore.set(credentials.identifier, session);
    } else {
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
      session = {
        cookies: [
          {
            name: cookieParameterName,
            value: cookie.value,
          },
        ],
        expiresAt: cookie.expires,
      };
    }

    return session;
  }

  public async authenticateRequest(
    request: ApiRequest,
    credentials: AuthenticationCredentials,
  ) {
    const session = await this.findOrInitializeSession(credentials);

    const sessionCookies = session.cookies.reduce(
      (a, { name, value }) => ({ ...a, [name]: value }),
      {},
    );

    request.cookies(sessionCookies);
  }
}
