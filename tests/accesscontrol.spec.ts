import { ApiRequest, ApiResponse } from "@japa/api-client";
import { test } from "@japa/runner";
import { AuthenticationStore } from "../src/core/authentication/authentication-store.ts";
import { RequestAuthenticator } from "../src/core/authentication/http/authenticator.ts";
import { SessionManager } from "../src/core/authentication/http/session-manager.ts";
import {
  HTTP_FORBIDDEN_STATUS_CODE,
  HTTP_UNAUTHORIZED_STATUS_CODE,
} from "../src/core/constants.ts";
import { ConfigurationParser } from "../src/core/parsers/configuration-parser.ts";
import { OpenAPIParser } from "../src/core/parsers/openapi-parser.ts";
import { TestcaseGenerator } from "../src/core/tests/testcase-generator.ts";

const configurationParser = new ConfigurationParser();
// todo: fix top-level await
// todo: no more Configuration -> constructor options? but how to get params into this file?
const { openApiUrl } = await configurationParser.parse();

const openAPIParser = await OpenAPIParser.create(openApiUrl);
// const paths = await openAPIParser.getPaths();
// openAPIParser.getApiBaseUrl();

// todo: this should return the corresponding authenticator based on the requested route
function getAuthenticatorByRoute(
  url: string,
  httpMethod: string,
): RequestAuthenticator | null {
  const securityScheme = openAPIParser.getSecurityScheme(url, httpMethod);
  const securitySchemeKey = securityScheme._key;

  console.debug(securityScheme);
  console.debug("GOT SECURITY SCHEME: " + securitySchemeKey);

  const authenticatorType =
    openAPIParser.getAuthenticatorTypeBySecurityScheme(securityScheme);

  // todo: can this result be cached or stored inside the state of the OpenApiParser?
  // so that mapping etc. only has to take place when specific auth strategy hasn't been queried yet

  const authEndpoint = openAPIParser.getAuthEndpoint(
    securitySchemeKey,
    authenticatorType,
  );

  const authenticator = AuthenticationStore.getOrCreateAuthenticator(
    authenticatorType,
    authEndpoint,
  );

  return authenticator;
}

const testController = new TestcaseGenerator(openAPIParser);

test.group("Access Control Testing", (group) => {
  // todo: create Route class with toString method for route
  test(
    "validate access control for route {route.method} {route.url} with user {user}",
  )
    .with(testController.generateTestDataset.bind(testController))
    .run(
      async (
        { client, expect },
        { user, route, expectedRequestToBeAllowed },
      ) => {
        const credentials = user.getCredentials();

        const MAX_REQUEST_RETRIES = 3; // todo: move to constants file
        const authenticator = getAuthenticatorByRoute(route.url, route.method);

        const response: ApiResponse = await client
          .request(route.url, route.method)
          .setup(async (request: ApiRequest) => {
            console.debug("SETUP REQUEST");
            if (authenticator) {
              await authenticator.authenticateRequest(request, credentials);
            }
          })
          .retry(MAX_REQUEST_RETRIES, (_error, response) => {
            const shouldRetry =
              response.status() === HTTP_UNAUTHORIZED_STATUS_CODE;
            console.debug(
              `retry request (${response.status()}): ` + shouldRetry,
            );

            if (shouldRetry && authenticator instanceof SessionManager) {
              authenticator.clearSession(credentials);

              // pending issue: setup won't be called again after retry
              // see: https://github.com/japa/runner/issues/57

              //await authenticator.initializeSession(credentials);
            }

            return shouldRetry;
          });

        // todo: make it configurable what is considered as forbidden
        // for now, forbidden is when the corresponding status code has been sent
        const statusCode = response.status();
        console.debug("STATUSCODE " + statusCode);

        // todo: what to do when 401 has been received? -> we can't really say whether the request was forbidden or not
        // maybe print out a warning?
        if (expectedRequestToBeAllowed) {
          // can be one of 2XX codes but could also be an error that occurred due to wrong syntax of request
          expect(statusCode).not.toBe(HTTP_FORBIDDEN_STATUS_CODE);
        } else {
          expect(statusCode).toBe(HTTP_FORBIDDEN_STATUS_CODE);
        }
      },
    );
});
