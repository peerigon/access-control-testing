import { RequestAuthenticator } from "./authenticator.ts";
import { AuthenticationCredentials, RequestOptions } from "./types.ts";

export class BasicAuthenticator implements RequestAuthenticator {
  public async authenticateRequest(
    requestOptions: RequestOptions,
    credentials: AuthenticationCredentials,
  ) {
    requestOptions.username = credentials.identifier;
    requestOptions.password = credentials.password;
  }
}
