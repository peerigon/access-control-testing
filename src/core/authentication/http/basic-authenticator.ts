import { ApiRequest } from "@japa/api-client/build/src/request";
import { HttpAuthenticator } from "./authenticator";
import { AuthenticationCredentials } from "./types";

export class BasicAuthenticator implements HttpAuthenticator {
  public async authenticateRequest(
    request: ApiRequest,
    credentials: AuthenticationCredentials,
  ) {
    request.basicAuth(credentials.identifier, credentials.password);
  }
}
