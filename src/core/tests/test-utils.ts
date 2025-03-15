import type { URL } from "node:url";
import got, { HTTPError, type Method, type PromiseCookieJar } from "got";
import type { RequestAuthenticator } from "../authentication/http/authenticator";
import { SessionManager } from "../authentication/http/session-manager.ts";
import type { AuthenticationCredentials } from "../authentication/http/types";
import {
  API_CLIENT_MAX_REQUEST_RETRIES,
  HTTP_UNAUTHORIZED_STATUS_CODE,
} from "../constants.ts";
import {
  OpenAPIParser,
  type ResourceLocationDescriptor,
} from "../parsers/openapi-parser.ts";
import type { ResourceIdentifier } from "../policy/types.ts";

export type RequestBody = object | undefined;

export class Route {
  constructor(
    public readonly url: URL,
    public readonly method: Method,
  ) {}

  toString() {
    return `${this.method.toUpperCase()} ${this.url}`;
  }
}

/**
 * Perform a request to the given route with the given authenticator and
 * credentials. Retries the request if it fails and throws an error if the
 * request continues to fail with a non 2xx/3xx status code.
 *
 * @param route
 * @param requestBody The request body to send as JSON
 * @param authenticator
 * @param credentials
 * @throws {Error} If the request needed prior authentication but failed to
 *   authenticate. See
 *   {@link https://github.com/sindresorhus/got/blob/main/documentation/8-errors.md list of errors}
 */
export async function performRequest({
  route,
  requestBody,
  authenticator,
  credentials,
}: {
  route: Route;
  requestBody?: RequestBody;
  authenticator: RequestAuthenticator | null;
  credentials: AuthenticationCredentials | null;
}) {
  const routeRequiresAuthentication = authenticator !== null;
  const userCredentialsAvailable = credentials !== null;

  const shouldRetry = routeRequiresAuthentication && userCredentialsAvailable;
  const retry = shouldRetry
    ? {
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] as Array<Method>, // todo: what about the rest?
        statusCodes: [HTTP_UNAUTHORIZED_STATUS_CODE],
        limit: API_CLIENT_MAX_REQUEST_RETRIES,
      }
    : undefined;

  return got(route.url, {
    method: route.method,
    json: requestBody,
    retry,
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
            try {
              await authenticator.authenticateRequest(options, credentials);
            } catch (error) {
              const isNonSuccessfulResponse =
                error instanceof HTTPError &&
                error.code === "ERR_NON_2XX_3XX_RESPONSE";

              // todo: include info about authentication endpoint in error message
              const user = credentials.identifier;
              if (isNonSuccessfulResponse) {
                // authentication endpoint was reached but got non-successful response
                throw new Error(
                  `The authentication endpoint returned a non-successful response indicating that the user '${user}' could not be authenticated.`,
                );
              } else {
                // something else went wrong, make sure auth endpoint is available
                throw new Error(
                  `Something went wrong while trying to reach the authentication endpoint for user '${user}', make sure it is available.`,
                );
              }
            }
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
              // this is wanted by the request library
              // eslint-disable-next-line require-atomic-updates
              options.headers["Cookie"] = cookieString;
            }
          }
        },
      ],
      afterResponse: [
        (response) => {
          if (
            response.statusCode === HTTP_UNAUTHORIZED_STATUS_CODE &&
            credentials &&
            authenticator instanceof SessionManager
          ) {
            authenticator.clearSession(credentials);
          }

          return response;
        },
      ],
    },
  });
}

/**
 * Creates the request data for an individual test combination by returning the
 * route to use and optionally the request body.
 */
export function createRequestData({
  path,
  method,
  currentResource,
  resourceIdentifier,
  openApiParser,
}: {
  path: string;
  method: Method;
  currentResource: ResourceLocationDescriptor;
  resourceIdentifier?: ResourceIdentifier;
  openApiParser: OpenAPIParser;
}) {
  // todo: currently only parameterLocation path supported
  // function should support parameterLocation, parameterName and parameterValue

  // resourceIdentifier can be undefined when resource access is create for instance
  // or when access for all resources of a type is described
  let requestBody: RequestBody;
  let processedPath = path;
  const queryParameters = new URLSearchParams();

  if (
    currentResource.parameterName !== undefined &&
    resourceIdentifier !== undefined
  ) {
    switch (currentResource.parameterLocation) {
      case "path": {
        processedPath = OpenAPIParser.expandUrlTemplate(path, {
          [currentResource.parameterName]: resourceIdentifier,
        });
        break;
      }
      case "query": {
        queryParameters.set(
          currentResource.parameterName,
          resourceIdentifier.toString(),
        );
        break;
      }
      case "body": {
        // todo: this only works for params on the top level of the request body
        requestBody = {
          [currentResource.parameterName]: resourceIdentifier,
        };
        break;
      }
    }
  }

  const url = openApiParser.constructFullApiUrl(processedPath);

  if (queryParameters.size > 0) {
    url.search = queryParameters.toString();
  }

  return {
    route: new Route(url, method),
    requestBody,
  };
}
