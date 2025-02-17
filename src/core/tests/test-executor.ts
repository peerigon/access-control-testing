import {
  HTTP_FORBIDDEN_STATUS_CODE,
  HTTP_UNAUTHORIZED_STATUS_CODE,
} from "../constants.ts";
import { OpenAPIParser } from "../parsers/openapi-parser.ts";
import { Resource } from "../policy/entities/resource.ts";
import { User } from "../policy/entities/user.js";
import { TestRunner } from "./runner/test-runner.ts";
import { performRequest } from "./test-utils.ts";
import { TestcaseGenerator } from "./testcase-generator.ts";

export class TestExecutor {
  /*  private async prepareTestDataset() {
    const configurationParser = new ConfigurationParser();
    // todo: no more Configuration -> constructor options? but how to get params into this file?
    const { openApiUrl } = await configurationParser.parse();

    const openAPIParser = await OpenAPIParser.create(openApiUrl);

    const testController = new TestcaseGenerator(openAPIParser);
    const dataset: TestDataset = testController.generateTestDataset(); //.bind(testController);
    return dataset;
  }*/

  public async runTests(
    testRunner: TestRunner,
    openApiUrl: string,
    apiBaseUrl: string,
    users: Array<User>,
    resources: Array<Resource>,
  ) {
    const openAPIParser = await OpenAPIParser.create(openApiUrl, apiBaseUrl);
    openAPIParser.validateCustomFields(resources);

    const testController = new TestcaseGenerator(
      openAPIParser,
      users,
      resources,
    );
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

    testRunner.group("🛡 Access Control Testing", () => {
      dataset.forEach((testCase) => {
        const { user, route, expectedRequestToBeAllowed } = testCase;

        testRunner.test(
          `Validate access control for ${testCase.route.method} ${testCase.route.url} with user ${testCase.user || "anonymous"}`,
          async () => {
            const isAnonymousUser = user === null;
            const credentials = isAnonymousUser ? null : user.getCredentials();

            const authenticator = openAPIParser.getAuthenticatorByRoute(
              route.url.toString(),
              route.method,
            );

            const response = await performRequest(
              route,
              authenticator,
              credentials,
            );

            // todo: make it configurable what is considered as forbidden
            // for now, forbidden is when the corresponding status code has been sent
            const { statusCode } = response;
            console.debug("STATUSCODE " + statusCode);

            // todo: what to do when 401 has been received? -> we can't really say whether the request was forbidden or not
            // maybe print out a warning?
            if (expectedRequestToBeAllowed) {
              // can be one of 2XX codes but could also be an error that occurred due to wrong syntax of request

              // todo: what about anonymous users? for them it should not be forbidden and also not unauthorized
              testRunner.expect(statusCode).notToBe(HTTP_FORBIDDEN_STATUS_CODE);
            } else {
              // as anonymous user, unauthorized or forbidden is okay
              if (isAnonymousUser) {
                testRunner
                  .expect([
                    HTTP_FORBIDDEN_STATUS_CODE, // todo: is forbidden really expected for users without authentication details or should it only be Unauthorized?
                    HTTP_UNAUTHORIZED_STATUS_CODE,
                  ])
                  .toContain(statusCode);
              } else {
                testRunner.expect(statusCode).toBe(HTTP_FORBIDDEN_STATUS_CODE);
              }
            }
          },
        );
      });
    });
  }
}
