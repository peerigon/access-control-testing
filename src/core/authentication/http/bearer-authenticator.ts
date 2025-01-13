import { ApiRequest } from "@japa/api-client/build/src/request";
import { OpenAPIParser } from "../../parsers/openapi-parser";
import { RequestAuthenticator } from "./authenticator";
import { SessionManager } from "./session-manager";
import { AuthenticationCredentials, BearerAuthSession } from "./types";

export class BearerAuthenticator
  extends SessionManager<BearerAuthSession>
  implements RequestAuthenticator
{
  constructor(
    private authEndpointInformation: Awaited<
      ReturnType<OpenAPIParser["getAuthEndpoint"]>
    >,
  ) {
    super();
  }

  protected async initializeSession(credentials: AuthenticationCredentials) {
    console.log("init new bearer session");
    const { response, authResponseParameterDescription } =
      await this.obtainSession(credentials);

    const { parameterName: tokenParameterName } =
      authResponseParameterDescription;

    const token: string | undefined = response.body()[tokenParameterName];

    if (!token) {
      // todo: add error handling
      throw new Error(
        "No token found in server response for the login endpoint",
      );
    }

    // todo: add error handling

    // todo: if token expiry is not defined in response (in our case token.expiresAt), read out token to store this extra piece of information
    const session: BearerAuthSession = {
      bearerToken: token,
      // todo: maybe include expiration and other provided information too?
    };

    this.sessionStore.set(credentials.identifier, session);

    return session;
  }

  public async authenticateRequest(
    request: ApiRequest,
    credentials: AuthenticationCredentials,
  ) {
    const session = await this.findOrInitializeSession(credentials);
    request.bearerToken(session.bearerToken);
  }
}
