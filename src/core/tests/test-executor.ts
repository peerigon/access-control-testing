import {
  API_CLIENT_MAX_REQUEST_RETRIES,
  HTTP_FORBIDDEN_STATUS_CODE,
  HTTP_UNAUTHORIZED_STATUS_CODE,
} from "../constants.ts";
import { OpenAPIParser } from "../parsers/openapi-parser.ts";
import { Resource } from "../policy/entities/resource.ts";
import { User } from "../policy/entities/user.js";
import { Route } from "../types.js";
import { TestRunner } from "./runner/test-runner.ts";
import { performRequest } from "./test-utils.ts";
import { TestcaseGenerator } from "./testcase-generator.ts";

type AccessControlResult = "allowed" | "forbidden";

type TestResult = {
  user: User | null;
  route: Route;
  expected: AccessControlResult;
  actual?: AccessControlResult;
  testSucceeded?: "✅" | "❌";
};

export class TestExecutor {
  /*  private async prepareTestDataset() {
    const configurationParser = new ConfigurationParser();
    // todo: no more Configuration -> constructor options? but how to get params into this file?
    const { openApiUrl } = await configurationParser.parse();

    const openAPIParser = await OpenAPIParser.create(openApiUrl);

    const testController = new TestcaseGenerator(openAPIParser);
    const dataset: TestCases = testController.generateTestCases(); //.bind(testController);
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

    const testController = new TestcaseGenerator(openAPIParser, users);
    const testCases = testController.generateTestCases(); //.bind(testController);

    /* console.log("DATASET");
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
    console.table(debugTable);*/
    const results: Array<TestResult> = [];

    for (const testCase of testCases) {
      testRunner.test("", async (t) => {
        const { user, route, expectedRequestToBeAllowed } = testCase;
        const expected: AccessControlResult = expectedRequestToBeAllowed
          ? "allowed"
          : "forbidden"; // todo: make enum for this?

        const testResult: TestResult = {
          user,
          route,
          expected,
          testSucceeded: "❌",
        };
        results.push(testResult);

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

        const isUnauthorized =
          response.statusCode === HTTP_UNAUTHORIZED_STATUS_CODE;

        // todo: what to do when 401 has been received? -> we can't really say whether the request was forbidden or not
        if (isUnauthorized) {
          // for isanonymous its expected, check if its not null user here

          // todo: make route toString()
          console.log(response.statusCode);
          console.warn(
            `Could not impersonate user ${user} for route ${route.method} ${route.url}.
            The server kept responding with status code ${HTTP_UNAUTHORIZED_STATUS_CODE} after ${API_CLIENT_MAX_REQUEST_RETRIES} retries have been made.
            No further tests will be executed for this user.
            Please check whether the credentials are correct and the authentication setup is properly configured.`,
          );

          t.skip("Recurring authentication problem"); // todo: new state for skipped? currently only pass/fail
          // todo: add user to blocklist
          return;
        }

        // todo: make it configurable what is considered as forbidden
        // for now, forbidden is when the corresponding status code has been sent
        const { statusCode } = response;
        console.debug("STATUSCODE " + statusCode);

        // let actualRequestAllowed: boolean;
        let actual: AccessControlResult =
          statusCode === HTTP_FORBIDDEN_STATUS_CODE ? "forbidden" : "allowed";

        if (expectedRequestToBeAllowed) {
          // can be one of 2XX codes but could also be an error that occurred due to wrong syntax of request

          // todo: what about anonymous users? for them it should not be forbidden and also not unauthorized
          testRunner.expect(statusCode).notToBe(HTTP_FORBIDDEN_STATUS_CODE);
        } else {
          // as anonymous user, unauthorized or forbidden is okay
          if (isAnonymousUser) {
            const requestForbidden = [
              HTTP_FORBIDDEN_STATUS_CODE, // todo: is forbidden really expected for users without authentication details or should it only be Unauthorized?
              HTTP_UNAUTHORIZED_STATUS_CODE,
            ].includes(statusCode);

            testRunner.expect(requestForbidden).toBe(true);

            actual = requestForbidden ? "forbidden" : "allowed"; // todo: maybe rename to rejected (is either forbidden/unauthorized)
          } else {
            testRunner.expect(statusCode).toBe(HTTP_FORBIDDEN_STATUS_CODE);
          }
        }

        testResult.actual = actual;
        testResult.testSucceeded = actual === expected ? "✅" : "❌";
      });
    }

    TestExecutor.printResults(results);
  }

  private static printResults(results: Array<TestResult>) {
    process.on("beforeExit", () => {
      console.log("\nTest Results:");
      const transformedResults = results.map((result) => ({
        ...result,
        user: result.user?.toString() ?? "anonymous",
      }));

      console.table(transformedResults);

      // todo: enhance this with a detailed report containing all the routes that failed
    });
  }
}
