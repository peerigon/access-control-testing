import got, { PromiseCookieJar } from "got";
import { RequestAuthenticator } from "../authentication/http/authenticator.ts";
import { AuthenticationCredentials } from "../authentication/http/types.ts";
import {
  API_CLIENT_MAX_REQUEST_RETRIES,
  HTTP_UNAUTHORIZED_STATUS_CODE,
} from "../constants.ts";
import type { Route } from "../types.ts";

export async function performRequest(
  route: Route,
  authenticator: RequestAuthenticator | null,
  credentials: AuthenticationCredentials | null,
) {
  return got(route.url, {
    method: route.method,
    retry: {
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // todo: what about the rest?
      statusCodes: [HTTP_UNAUTHORIZED_STATUS_CODE],
      limit: API_CLIENT_MAX_REQUEST_RETRIES,
    },
    throwHttpErrors: false,
    hooks: {
      beforeRequest: [
        async (options) => {
          if (authenticator && credentials) {
            await authenticator.authenticateRequest(options, credentials);
          }

          // todo: this is a temporary workaround to ensure that cookies get set
          // it seems to be not possible to set cookieJar on beforeRequest
          const cookieJar = options.cookieJar;

          if (cookieJar) {
            const promiseCookieJar = cookieJar as PromiseCookieJar;
            const cookieString = await promiseCookieJar.getCookieString(
              route.url.toString(),
            );

            if (cookieString.length > 0) {
              options.headers.Cookie = cookieString;
            }
          }
        },
      ],
    },
  });
}
