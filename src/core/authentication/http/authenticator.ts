import type { ApiRequest } from "@japa/api-client";
import { AuthenticationCredentials } from "./types.ts";

export interface RequestAuthenticator {
  /**
   * Enhances the request with the required authentication information
   * @protected
   */
  authenticateRequest(
    request: ApiRequest,
    credentials: AuthenticationCredentials,
  ): Promise<void>;
}
