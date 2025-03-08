import { type RequestAuthenticator } from "./authenticator.ts";
import {
  type AuthenticationCredentials,
  type RequestOptions,
} from "./types.ts";

export class BasicAuthenticator implements RequestAuthenticator {
  async authenticateRequest(
    requestOptions: RequestOptions,
    credentials: AuthenticationCredentials,
  ) {
    requestOptions.username = credentials.identifier;
    requestOptions.password = credentials.password;
  }
}
