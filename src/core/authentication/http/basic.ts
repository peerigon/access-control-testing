import { ApiRequest } from "@japa/api-client/build/src/request";
import { HttpAuthenticator } from "./authenticator";
import { AuthenticationCredentials, BasicAuthSession } from "./types";

export class BasicAuthenticator implements HttpAuthenticator {
  public async authenticateRequest(
    request: ApiRequest,
    credentials: AuthenticationCredentials,
  ): Promise<ApiRequest> {
    request.basicAuth(credentials.identifier, credentials.password);
    return request;
  }
}
