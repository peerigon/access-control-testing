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
    // todo: only use existing session when not alreay expired
    // todo: remove expired entries before accessing
    const existingSession = this.sessionStore.get(credentials.identifier);

    if (existingSession === undefined) {
      return this.initializeSession(credentials);
    }

    console.log("Reusing existing session");

    return existingSession;
  }

  protected abstract initializeSession(
    credentials: AuthenticationCredentials,
  ): Promise<SessionType>;
}
