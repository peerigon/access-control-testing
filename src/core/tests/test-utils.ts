import got from "got";
import { RequestAuthenticator } from "../authentication/http/authenticator.ts";
import { AuthenticationCredentials } from "../authentication/http/types.js";
import { HTTP_UNAUTHORIZED_STATUS_CODE } from "../constants.js";
import type { Route } from "../types.ts";

export async function performRequest(
  route: Route,
  authenticator: RequestAuthenticator | null,
  credentials: AuthenticationCredentials,
) {
  return got(route.url, {
    method: route.method,
    retry: {
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // todo: what about the rest?
      statusCodes: [HTTP_UNAUTHORIZED_STATUS_CODE],
    },
    throwHttpErrors: false,
    hooks: {
      beforeRequest: [
        async (options) => {
          if (authenticator) {
            await authenticator.authenticateRequest(options, credentials);
          }

          // todo: this is a temporary workaround to ensure that cookies get set
          // it seems to be not possible to set cookieJar on beforeRequest
          // todo: type signature of getCookieString seems to be wrong
          const cookieString = await options.cookieJar?.getCookieString(
            route.url,
          );
          if (typeof cookieString === "string" && cookieString.length > 0) {
            options.headers.Cookie = cookieString;
          }
        },
      ],
    },
  });
}
