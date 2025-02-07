import type { AuthenticationCredentials, RequestOptions } from "./types.ts";

export interface RequestAuthenticator {
  /**
   * Enhances the request with the required authentication information
   * @protected
   */
  authenticateRequest(
    requestOptions: RequestOptions,
    credentials: AuthenticationCredentials,
  ): Promise<void>;
}
