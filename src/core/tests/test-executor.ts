import {
  HTTP_FORBIDDEN_STATUS_CODE,
  HTTP_UNAUTHORIZED_STATUS_CODE,
} from "../constants.ts";
import { OpenAPIParser } from "../parsers/openapi-parser.ts";
import { Resource } from "../policy/entities/resource.ts";
import { User } from "../policy/entities/user.js";
import { TestRunner } from "./runner/test-runner.ts";
import { performRequest, Route } from "./test-utils.ts";
import { TestcaseGenerator } from "./testcase-generator.ts";

type AccessControlResult = "allowed" | "forbidden";

type TestResult = {
  user: User | null;
  route: Route;
  expected: AccessControlResult;
  actual?: AccessControlResult;
  testResult?: "✅" | "❌" | "⏭️";
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

    const results: Array<TestResult> = [];
    const blockedUserIdentifiers: Array<User["identifier"]> = [];

    for (const testCase of testCases) {
      const { user, route, expectedRequestToBeAllowed } = testCase;

      testRunner.test(
        `${route} from the perspective of user '${user ?? "anonymous"}'`,
        async (t) => {
          const userHasBeenBlocked =
            user !== null &&
            blockedUserIdentifiers.includes(user.getCredentials().identifier);
          if (userHasBeenBlocked) {
            t.skip(
              `User '${user}' has been blocked since a previous attempt to authenticate failed.`,
            );
            return;
          }

          const expected: AccessControlResult = expectedRequestToBeAllowed
            ? "allowed"
            : "forbidden"; // todo: make enum for this?

          const testResult: TestResult = {
            user,
            route,
            expected,
            testResult: "❌",
          };
          results.push(testResult);

          const isAnonymousUser = user === null;
          const credentials = isAnonymousUser ? null : user.getCredentials();

          const authenticator = openAPIParser.getAuthenticatorByRoute(route);

          let response;
          try {
            response = await performRequest(route, authenticator, credentials);
          } catch (e: unknown) {
            // todo: create two Error instances
            if (e instanceof Error) {
              console.error(e.message);

              console.warn(
                `Could not impersonate user '${user}' while trying to reach route ${route.method} ${route.url}.
            This test will be skipped and further testcases for user '${user}' will be cancelled.
            Please check whether you provided correct credentials and the authentication setup is properly configured.`,
              );

              if (user !== null) {
                blockedUserIdentifiers.push(user.getCredentials().identifier);
              }

              testResult.testResult = "⏭️";
              t.skip(e.message);
            }

            return;
          }

          const isUnauthorized =
            response.statusCode === HTTP_UNAUTHORIZED_STATUS_CODE;

          /*       if (isUnauthorized && !isAnonymousUser) {
          // todo: make route toString()
          const { retryCount } = response;
          const recurringAuthenticationProblem = retryCount > 0;

          console.warn(
            `Although the user ${user} has been authenticated using the authentication endpoint, the server responded with status code ${HTTP_UNAUTHORIZED_STATUS_CODE} when trying to access route ${route.method} ${route.url}.
            ${recurringAuthenticationProblem ? `The server kept responding with status code ${response.statusCode} after ${retryCount} retries have been made.` : `The server responded with status code ${response.statusCode}.`}
            This testcase will be skipped.
            Please check whether the credentials are correct and the authentication setup is properly configured.`,
          );

          t.skip(
            recurringAuthenticationProblem
              ? "Recurring authentication problem"
              : "Authentication problem",
          ); // todo: new state for skipped? currently only pass/fail
          return;
        }*/

          // todo: make it configurable what is considered as forbidden
          // for now, forbidden is when the corresponding status code has been sent
          const { statusCode } = response;
          console.debug("STATUSCODE " + statusCode);

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
          //testResult.authenticator = authenticator;
          testResult.testResult = actual === expected ? "✅" : "❌";
        },
      );
    }

    TestExecutor.printResults(results);
  }

  private static printResults(results: Array<TestResult>) {
    process.on("beforeExit", () => {
      console.log("\nTest Results:");
      const transformedResults = results.map((result) => ({
        ...result,
        user: result.user?.toString() ?? "anonymous",
        route: result.route.toString(),
      }));

      console.table(transformedResults);

      // todo: enhance this with a detailed report containing all the routes that failed
    });
  }
}
