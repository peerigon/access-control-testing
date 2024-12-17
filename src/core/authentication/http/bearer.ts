import { HttpAuthenticator } from "./authenticator";
import { AuthenticationCredentials, BearerAuthSession } from "./types";

export class BearerAuthenticator extends HttpAuthenticator<BearerAuthSession> {
  constructor() {
    super();
    // todo: get and store login route information from params
  }
  protected initializeSession(credentials: AuthenticationCredentials) {
    // todo: based on route information, perform a login request to the API
    // and store the obtained bearer token

    const session: BearerAuthSession = {
      bearerToken: "todo",
      // todo: maybe include expiration and other provided information too?
    };

    this.sessionStore.set(credentials.identifier, session);

    return session;
  }
}
