import { ApiRequest } from "@japa/api-client/build/src/request";
import { HttpAuthenticator } from "./authenticator";
import { AuthenticationCredentials, BasicAuthSession } from "./types";

export class BasicAuthenticator extends HttpAuthenticator<BasicAuthSession> {
  protected async initializeSession(credentials: AuthenticationCredentials) {
    // todo: for basic auth, no need to initialize a session
    // move session initialization part to an interface
    const authorizationPayload = Buffer.from(
      `${credentials.identifier}:${credentials.password}`,
    ).toString("base64");

    const session: BasicAuthSession = {
      authorizationPayload,
    };

    this.sessionStore.set(credentials.identifier, session);

    return session;
  }

  public async authenticateRequest(
    request: ApiRequest,
    credentials: AuthenticationCredentials,
  ): Promise<ApiRequest> {
    const session = await this.findOrInitializeSession(credentials);
    request.basicAuth(credentials.identifier, credentials.password);
    return request;
  }
}
