import { HttpAuthenticator } from "./authenticator";
import { AuthenticationCredentials, Session } from "./types";

export class BearerAuthenticator extends HttpAuthenticator {
  protected findOrInitializeSession(
    credentials: AuthenticationCredentials,
  ): Session {
    throw new Error("Method not implemented.");
  }
  protected initializeSession(credentials: AuthenticationCredentials): Session {
    throw new Error("Method not implemented.");
  }
}
