import { AuthenticationCredentials, Session } from "./types";

export abstract class SessionManager<SessionType extends Session> {
  protected sessionStore: Map<
    AuthenticationCredentials["identifier"],
    SessionType
  > = new Map();

  /**
   *
   * @protected
   * @param credentials The credentials used to find an existing session or to initialize a new one
   * @returns The session
   */
  protected async findOrInitializeSession(
    credentials: AuthenticationCredentials,
  ): Promise<SessionType> {
    const existingSession = this.sessionStore.get(credentials.identifier);

    if (existingSession === undefined) {
      return this.initializeSession(credentials);
    }

    return existingSession;
  }

  protected abstract initializeSession(
    credentials: AuthenticationCredentials,
  ): Promise<SessionType>;
}
