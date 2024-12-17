import { AuthenticationCredentials, Session } from "./types";

export abstract class HttpAuthenticator<SessionType extends Session> {
  protected sessionStore: Map<string, SessionType> = new Map();

  /**
   *
   * @protected
   * @param credentials The credentials used to find the session or to initialize a new one
   * @returns The session
   */
  protected findOrInitializeSession(
    credentials: AuthenticationCredentials,
  ): SessionType {
    const existingSession = this.sessionStore.get(credentials.identifier);

    if (existingSession === undefined) {
      return this.initializeSession(credentials);
    }

    return existingSession;
  }

  protected abstract initializeSession(
    credentials: AuthenticationCredentials,
  ): SessionType;

  /**
   * Enhances the request with the required authentication information
   * @protected
   */
  // todo
  // protected abstract authenticateRequest(request): null;
}
