import { ApiRequest } from "@japa/api-client/build/src/request";
import { HttpAuthenticator } from "./authenticator";
import { SessionManager } from "./session-manager";
import { AuthenticationCredentials, BearerAuthSession } from "./types";

export class BearerAuthenticator
  extends SessionManager<BearerAuthSession>
  implements HttpAuthenticator
{
  constructor() {
    super();
    // todo: get and store login route information from params
  }

  protected async initializeSession(credentials: AuthenticationCredentials) {
    // todo: based on route information, perform a login request to the API
    // and store the obtained bearer token

    const session: BearerAuthSession = {
      bearerToken: "todo",
      // todo: maybe include expiration and other provided information too?
    };

    this.sessionStore.set(credentials.identifier, session);

    return session;
  }

  public async authenticateRequest(
    request: ApiRequest,
    credentials: AuthenticationCredentials,
  ): Promise<ApiRequest> {
    const session = await this.findOrInitializeSession(credentials);
    request.bearerToken(session.bearerToken);
    return request;
  }
}
