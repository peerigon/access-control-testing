import { URL } from "node:url";
import got from "got";
import { CookieJar } from "tough-cookie";
import type { AuthEndpointInformation } from "../../types.js";
import type { AuthenticationCredentials, Session } from "./types.ts";

export abstract class SessionManager<SessionType extends Session> {
  protected sessionStore = new Map<
    AuthenticationCredentials["identifier"],
    SessionType
  >();

  constructor(
    private readonly authEndpointInformation: AuthEndpointInformation,
    private readonly apiBaseUrl: string,
  ) {}

  /**
   * @param credentials The credentials used to find an existing session or to
   *   initialize a new one
   * @returns The session
   * @protected
   */
  protected async findOrInitializeSession(
    credentials: AuthenticationCredentials,
  ): Promise<SessionType> {
    // todo: only use existing session when not already expired
    // todo: remove expired entries before accessing
    const existingSession = this.sessionStore.get(credentials.identifier);

    if (existingSession === undefined) {
      console.debug("SessionManager: INIT NEW SESSION");
      return this.initializeSession(credentials);
    }

    console.debug("Reusing existing session");

    return existingSession;
  }

  protected abstract initializeSession(
    credentials: AuthenticationCredentials,
  ): Promise<SessionType>;

  /**
   * Obtains a new session by sending a request to the authentication endpoint
   * @param credentials
   * @throws
   * See {@link https://github.com/sindresorhus/got/blob/main/documentation/8-errors.md list of errors}
   * @protected
   */
  protected async obtainSession(credentials: AuthenticationCredentials) {
    console.debug("obtaining new session");

    const {
      authEndpoint,
      authRequestParameterDescription,
      authResponseParameterDescription,
    } = this.authEndpointInformation;

    const { parameterName: usernameParameterName } =
      authRequestParameterDescription.username;
    const { parameterName: passwordParameterName } =
      authRequestParameterDescription.password;

    if (!usernameParameterName || !passwordParameterName) {
      // todo: better error handling
      // todo: maybe use a default value as fallback for email/password field names
      throw new Error("Username and password parameter names are required");
    }

    const cookieJar = new CookieJar();

    const url = new URL(authEndpoint.path, this.apiBaseUrl);
    // todo: add try/catch block?

    // todo: or instead of accepting a base url, accept a got instance?
    const response = await got(url, {
      method: authEndpoint.method,
      json: {
        [usernameParameterName]: credentials.identifier,
        [passwordParameterName]: credentials.password,
      },
      cookieJar,
      throwHttpErrors: true,
    });

    return {
      authResponseParameterDescription,
      response,
      cookieJar,
    };
  }

  clearSession(credentials: AuthenticationCredentials): void {
    console.debug("clearing session");
    this.sessionStore.delete(credentials.identifier);
  }
}
