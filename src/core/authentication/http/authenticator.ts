import { AuthenticationCredentials, Session } from "./types";

export abstract class HttpAuthenticator {
  /**
   *
   * @protected
   * @param credentials The credentials used to find the session or to initialize a new one
   * @returns The session
   */
  protected abstract findOrInitializeSession(
    credentials: AuthenticationCredentials,
  ): Session;

  protected abstract initializeSession(
    credentials: AuthenticationCredentials,
  ): Session;
}
