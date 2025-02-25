import { RequestAuthenticator } from "./authenticator.ts";
import { SessionManager } from "./session-manager.ts";
import type {
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
    const { cookieJar } = await this.obtainSession(credentials);

    // todo: make storing all cookies configurable (STORE_ALL_COOKIES)
    // todo: clarify if STORE_ALL_COOKIES mode could help with csrf protection set
    const session: CookieAuthSession = {
      cookies: cookieJar,
      // maybe also include information about session-relevant cookie name
    };

    this.sessionStore.set(credentials.identifier, session);

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
