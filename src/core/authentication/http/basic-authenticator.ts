import { ApiRequest } from "@japa/api-client/build/src/request";
import { RequestAuthenticator } from "./authenticator";
import { AuthenticationCredentials } from "./types";

export class BasicAuthenticator implements RequestAuthenticator {
  public async authenticateRequest(
    request: ApiRequest,
    credentials: AuthenticationCredentials,
  ) {
    request.basicAuth(credentials.identifier, credentials.password);
  }
}
