import type { ApiRequest } from "@japa/api-client";
import { RequestAuthenticator } from "./authenticator.ts";
import { AuthenticationCredentials } from "./types.ts";

export class BasicAuthenticator implements RequestAuthenticator {
  public async authenticateRequest(
    request: ApiRequest,
    credentials: AuthenticationCredentials,
  ) {
    request.basicAuth(credentials.identifier, credentials.password);
  }
}
