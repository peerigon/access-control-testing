import type { ApiClient, ApiRequest } from "@japa/api-client";
import { RequestAuthenticator } from "../authentication/http/authenticator.ts";
import { SessionManager } from "../authentication/http/session-manager.ts";
import { AuthenticationCredentials } from "../authentication/http/types.js";
import {
  API_CLIENT_MAX_REQUEST_RETRIES,
  HTTP_UNAUTHORIZED_STATUS_CODE,
} from "../constants.ts";
import type { Route } from "../types.ts";

export async function performRequest(
  client: ApiClient,
  route: Route,
  authenticator: RequestAuthenticator | null,
  credentials: AuthenticationCredentials,
) {
  return client
    .request(route.url, route.method)
    .setup(async (request: ApiRequest) => {
      console.debug("SETUP REQUEST");
      if (authenticator) {
        await authenticator.authenticateRequest(request, credentials);
      }
    })
    .retry(API_CLIENT_MAX_REQUEST_RETRIES, (_error, response) => {
      const shouldRetry = response.status() === HTTP_UNAUTHORIZED_STATUS_CODE;
      console.debug(`retry request (${response.status()}): ` + shouldRetry);

      if (shouldRetry && authenticator instanceof SessionManager) {
        authenticator.clearSession(credentials);

        // pending issue: setup won't be called again after retry
        // see: https://github.com/japa/runner/issues/57

        //await authenticator.initializeSession(credentials);
      }

      return shouldRetry;
    });
}
