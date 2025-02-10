import { test } from "@japa/runner";
import { AuthenticationStore } from "../src/core/authentication/authentication-store.ts";
import { RequestAuthenticator } from "../src/core/authentication/http/authenticator.ts";
import { HTTP_FORBIDDEN_STATUS_CODE } from "../src/core/constants.ts";
import { ConfigurationParser } from "../src/core/parsers/configuration-parser.ts";
import { OpenAPIParser } from "../src/core/parsers/openapi-parser.ts";
import { performRequest } from "../src/core/tests/test-utils.js";
import { TestcaseGenerator } from "../src/core/tests/testcase-generator.ts";

const configurationParser = new ConfigurationParser();
// todo: no more Configuration -> constructor options? but how to get params into this file?
const { openApiUrl } = await configurationParser.parse();

const openAPIParser = await OpenAPIParser.create(openApiUrl);

/**
 * Get a Singleton instance of the authenticator based on the route if the route requires authentication
 */
function getAuthenticatorByRoute(
  url: string,
  httpMethod: string,
): RequestAuthenticator | null {
  const securityScheme = openAPIParser.getSecurityScheme(url, httpMethod);

  if (!securityScheme) {
    return null;
  }

  const securitySchemeKey = securityScheme._key;

  console.debug(securityScheme);
  console.debug("GOT SECURITY SCHEME: " + securitySchemeKey);

  const authenticatorType =
    openAPIParser.getAuthenticatorTypeBySecurityScheme(securityScheme);

  // todo: can this result be cached or stored inside the state of the OpenApiParser?
  // so that mapping etc. only has to take place when specific auth strategy hasn't been queried yet

  const authEndpoint = openAPIParser.getAuthEndpoint(
    securityScheme,
    authenticatorType,
  );

  return AuthenticationStore.getOrCreateAuthenticator(
    authenticatorType,
    authEndpoint,
  );
}

const testController = new TestcaseGenerator(openAPIParser);
const dataset = testController.generateTestDataset(); //.bind(testController);

console.log("DATASET");
const debugTable = dataset.map((ds) => {
  const { user, route, expectedRequestToBeAllowed, ...rest } = ds;
  return {
    user: user?.toString() ?? "anonymous",
    route: route.url.toString(),
    method: route.method,
    expectedRequestToBeAllowed,
    ...rest,
  };
});
console.table(debugTable);

test.group("Access Control Testing", () => {
  // todo: create Route class with toString method for route
  test(
    "validate access control for route {route.method} {route.url} with user {user}",
  )
    .with(dataset)
    .run(async ({ expect }, { user, route, expectedRequestToBeAllowed }) => {
      const credentials = user?.getCredentials() ?? null;

      const authenticator = getAuthenticatorByRoute(
        route.url.toString(),
        route.method,
      );

      const response = await performRequest(route, authenticator, credentials);

      // todo: make it configurable what is considered as forbidden
      // for now, forbidden is when the corresponding status code has been sent
      const { statusCode } = response;
      console.debug("STATUSCODE " + statusCode);

      // todo: what to do when 401 has been received? -> we can't really say whether the request was forbidden or not
      // maybe print out a warning?
      if (expectedRequestToBeAllowed) {
        // can be one of 2XX codes but could also be an error that occurred due to wrong syntax of request
        expect(statusCode).not.toBe(HTTP_FORBIDDEN_STATUS_CODE);
      } else {
        expect(statusCode).toBe(HTTP_FORBIDDEN_STATUS_CODE);
      }
    });
});
