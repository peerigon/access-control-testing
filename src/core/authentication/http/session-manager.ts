import { ApiClient, ApiResponse } from "@japa/api-client";
import { OpenAPIParser } from "../../parsers/openapi-parser";
import { AuthenticationCredentials, Session } from "./types";

export abstract class SessionManager<SessionType extends Session> {
  protected sessionStore: Map<
    AuthenticationCredentials["identifier"],
    SessionType
  > = new Map();

  constructor(
    private authEndpointInformation: ReturnType<
      OpenAPIParser["getAuthEndpoint"]
    >,
  ) {}

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

  protected async obtainSession(credentials: AuthenticationCredentials) {
    console.log("obtaining new session");
    // todo: get this from config
    const apiClient = new ApiClient("http://localhost:3333");

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

    const response: ApiResponse = await apiClient
      .request(authEndpoint.path, authEndpoint.method)
      .json({
        [usernameParameterName]: credentials.identifier,
        [passwordParameterName]: credentials.password,
      });

    return {
      authResponseParameterDescription,
      response,
    };
  }

  public clearSession(credentials: AuthenticationCredentials): void {
    console.debug("clearing session");
    this.sessionStore.delete(credentials.identifier);
  }
}
