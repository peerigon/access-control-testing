import { type RequestAuthenticator } from "./authenticator.ts";
import { SessionManager } from "./session-manager.ts";
import type {
  AuthenticationCredentials,
  BearerAuthSession,
  RequestOptions,
} from "./types.ts";

export class BearerAuthenticator
  extends SessionManager<BearerAuthSession>
  implements RequestAuthenticator
{
  protected async initializeSession(credentials: AuthenticationCredentials) {
    const { response, authResponseParameterDescription } =
      await this.obtainSession(credentials);

    const { parameterName: tokenParameterName } =
      authResponseParameterDescription;

    // todo: what if it's not json?
    const token: string | undefined = JSON.parse(response.body)[
      tokenParameterName
    ];

    if (!token) {
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

  async authenticateRequest(
    requestOptions: RequestOptions,
    credentials: AuthenticationCredentials,
  ) {
    const session = await this.findOrInitializeSession(credentials);

    if (!session.bearerToken) {
      throw new Error("Could not initialize session with bearer token");
    }

    requestOptions.headers["Authorization"] = `Bearer ${session.bearerToken}`;
  }
}
