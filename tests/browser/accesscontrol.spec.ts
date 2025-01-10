import { ApiResponse } from "@japa/api-client";
import { test } from "@japa/runner";
import { BearerAuthenticator } from "../../src/core/authentication/http/bearer";
import { AuthenticationCredentials } from "../../src/core/authentication/http/types";
import { HTTP_FORBIDDEN_STATUS_CODE } from "../../src/core/constants";
import { User } from "../../src/core/entities/user";
import { ConfigurationParser } from "../../src/core/parsers/configuration";
import { OpenAPIParser } from "../../src/core/parsers/openapi";
import { Route } from "../../src/core/types";

const configurationParser = new ConfigurationParser();
// todo: fix top-level await
const { openApiUrl } = await configurationParser.parse();

const openAPIParser = new OpenAPIParser(openApiUrl);
const paths = await openAPIParser.getPaths();

// todo: implement this & move function outside
// for now just dummy implementation
function buildTestDataset(): Array<{
  user: User;
  route: Route;
  expectedRequestToBeAllowed: boolean;
}> {
  const user1 = new User("niklas.haug@tha.de", "niklas.haug@tha.de");
  return [
    {
      user: user1,
      route: {
        url: "/admin/users",
        method: "get",
        // maybe include securitySchemeIdentifier here?
      },
      expectedRequestToBeAllowed: false, // todo: these objects will get mapped (.map) and the state here will be calculated by a dedicated function
    },
    // same object just to verify whether existing session gets properly reused
    {
      user: user1,
      route: {
        url: "/admin/users",
        method: "get",
      },
      expectedRequestToBeAllowed: false, // todo: these objects will get mapped (.map) and the state here will be calculated by a dedicated function
    },
  ];
}

test.group("Access Control Testing", (group) => {
  group.each.setup(() => {
    console.log("executed before the test");
  });

  group.each.teardown(() => {
    console.log("executed after the test");
  });

  // todo: figure out if Playwright is still needed?
  // using Japa Datasets: https://japa.dev/docs/datasets
  test("validate access control")
    .with(buildTestDataset)
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

        // todo: can this be cached or stored inside the state of the OpenApiParser?
        // so that mapping etc. only has to take place when specific auth strategy hasn't been queried yet
        const authEndpoint = await openAPIParser.getAuthEndpoint(
          "bearerHttpAuthentication",
        );

        // todo: find out which authentication to use for the given route, create a function for this
        // decide based on the result of getAuthEndpoint which authenticator to use
        const authenticator = new BearerAuthenticator(authEndpoint);

        const response: ApiResponse = await client
          .request(route.url, route.method)
          .setup(async (request: ApiRequest) => {
            await authenticator.authenticateRequest(request, credentials);
          });

        response.dump();

        // check response status
        // todo: make it configurable what is considered as forbidden
        // for now, forbidden is when the corresponding status code has been sent
        const statusCode = response.status();
        console.log("Status code", statusCode);
        console.log("Status type", response.statusType());

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
