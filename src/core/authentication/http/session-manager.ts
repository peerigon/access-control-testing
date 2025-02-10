import { URL } from "node:url";
import got from "got";
import { CookieJar } from "tough-cookie";
import type { AuthEndpointInformation } from "../../types.js";
import type { AuthenticationCredentials, Session } from "./types.ts";

export abstract class SessionManager<SessionType extends Session> {
  protected sessionStore: Map<
    AuthenticationCredentials["identifier"],
    SessionType
  > = new Map();

  constructor(private authEndpointInformation: AuthEndpointInformation) {}

  /**
   *
   * @protected
   * @param credentials The credentials used to find an existing session or to initialize a new one
   * @returns The session
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

    const baseUrl = "http://localhost:3333/"; // todo: get this from config
    const url = new URL(authEndpoint.path, baseUrl);
    // todo: add try/catch block?

    const response = await got(url, {
      method: authEndpoint.method,
      json: {
        [usernameParameterName]: credentials.identifier,
        [passwordParameterName]: credentials.password,
      },
      cookieJar,
    });

    return {
      authResponseParameterDescription,
      response,
      cookieJar,
    };
  }

  public clearSession(credentials: AuthenticationCredentials): void {
    console.debug("clearing session");
    this.sessionStore.delete(credentials.identifier);
  }
}
