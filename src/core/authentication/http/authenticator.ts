import { ApiRequest } from "@japa/api-client/build/src/request";
import { AuthenticationCredentials } from "./types";

// todo: maybe rename to RequestAuthenticator
export interface HttpAuthenticator {
  /**
   * Enhances the request with the required authentication information
   * @protected
   */
  authenticateRequest(
    request: ApiRequest,
    credentials: AuthenticationCredentials,
  ): Promise<void>;
}
