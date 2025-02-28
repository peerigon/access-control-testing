import got, { type PromiseCookieJar } from "got";
import { RequestAuthenticator } from "../authentication/http/authenticator.ts";
import { AuthenticationCredentials } from "../authentication/http/types.ts";
import {
  API_CLIENT_MAX_REQUEST_RETRIES,
  HTTP_UNAUTHORIZED_STATUS_CODE,
} from "../constants.ts";
import type { Route } from "../types.ts";

/**
 * Perform a request to the given route with the given authenticator and credentials.
 * Retries the request if it fails and throws an error if the request continues to fail with a non 2xx/3xx status code.
 * @param route
 * @param authenticator
 * @param credentials
 * @throws
 * See {@link https://github.com/sindresorhus/got/blob/main/documentation/8-errors.md list of errors}
 */
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
      beforeRetry: [
        (error, retryCount) => {
          console.debug(`Retrying [${retryCount}]: ${error.code}`);
        },
      ],
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
