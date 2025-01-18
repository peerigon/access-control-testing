import { ApiRequest, ApiResponse } from "@japa/api-client";
import { test } from "@japa/runner";
import { AuthenticationStore } from "../src/core/authentication/authentication-store";
import { RequestAuthenticator } from "../src/core/authentication/http/authenticator";
import { AuthenticationCredentials } from "../src/core/authentication/http/types";
import { HTTP_FORBIDDEN_STATUS_CODE } from "../src/core/constants";
import { ConfigurationParser } from "../src/core/parsers/configuration-parser";
import { OpenAPIParser } from "../src/core/parsers/openapi-parser";
import { TestcaseGenerator } from "../src/core/tests/testcase-generator";

const configurationParser = new ConfigurationParser();
// todo: fix top-level await
// todo: no more Configuration -> constructor options? but how to get params into this file?
const { openApiUrl } = await configurationParser.parse();

const openAPIParser = new OpenAPIParser(openApiUrl);
// const paths = await openAPIParser.getPaths();
// openAPIParser.getApiBaseUrl();

// todo: this should return the corresponding authenticator based on the requested route
async function getAuthenticatorByRoute(
  url: string,
  httpMethod: string,
): Promise<RequestAuthenticator | null> {
  const securityScheme = await openAPIParser.getSecurityScheme(url, httpMethod);
  const securitySchemeKey = securityScheme._key;

  console.log(securityScheme);
  console.log("GOT SECURITY SCHEME: " + securitySchemeKey);

  const authenticatorType =
    openAPIParser.getAuthenticatorTypeBySecurityScheme(securityScheme);

  // todo: can this result be cached or stored inside the state of the OpenApiParser?
  // so that mapping etc. only has to take place when specific auth strategy hasn't been queried yet
  const authEndpoint = await openAPIParser.getAuthEndpoint(
    securitySchemeKey,
    authenticatorType,
  );

  const authenticator = AuthenticationStore.getOrCreateAuthenticator(
    authenticatorType,
    authEndpoint,
  );

  return authenticator;
}

test.group("Access Control Testing", (group) => {
  // todo: figure out if Playwright is still needed?
  // using Japa Datasets: https://japa.dev/docs/datasets
  test("validate access control")
    .with(new TestcaseGenerator(openAPIParser).generateTestDataset)
    .run(
      async (
        { client, expect },
        { user, route, expectedRequestToBeAllowed },
      ) => {
        // maybe add getCredentials() function to User class
        const credentials: AuthenticationCredentials = {
          identifier: user.identifier,
          password: user.password,
        };

        const response: ApiResponse = await client
          .request(route.url, route.method)
          .setup(async (request: ApiRequest) => {
            const authenticator = await getAuthenticatorByRoute(
              route.url,
              route.method,
            );

            if (authenticator) {
              await authenticator.authenticateRequest(request, credentials);
            }
            /*console.log("dump request cookies");
            request.dumpCookies();*/
          });

        /*  console.log("response dump");
        response.dump();*/

        // todo: make it configurable what is considered as forbidden
        // for now, forbidden is when the corresponding status code has been sent
        const statusCode = response.status();

        if (expectedRequestToBeAllowed) {
          // can be one of 2XX codes but could also be an error that occurred due to wrong syntax of request
          expect(statusCode).not.toBe(HTTP_FORBIDDEN_STATUS_CODE);
        } else {
          // todo: what to do when 401 has been received?
          expect(statusCode).toBe(HTTP_FORBIDDEN_STATUS_CODE);
        }
      },
    );
});
