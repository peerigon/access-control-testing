import { HttpAuthenticator } from "./authenticator";
import { AuthenticationCredentials, BasicAuthSession } from "./types";

export class BasicAuthenticator extends HttpAuthenticator<BasicAuthSession> {
  protected initializeSession(credentials: AuthenticationCredentials) {
    const authorizationPayload = Buffer.from(
      `${credentials.identifier}:${credentials.password}`,
    ).toString("base64");

    const session: BasicAuthSession = {
      authorizationPayload,
    };

    this.sessionStore.set(credentials.identifier, session);

    return session;
  }
}
