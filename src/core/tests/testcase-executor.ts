import {
  HTTP_FORBIDDEN_STATUS_CODE,
  HTTP_UNAUTHORIZED_STATUS_CODE,
} from "../constants.ts";
import { OpenAPIParser } from "../parsers/openapi-parser.ts";
import type { User } from "../policy/entities/user.ts";
import type {
  AccessControlResult,
  TestContext,
  TestResult,
} from "./runner/test-runner.ts";
import { performRequest } from "./test-utils.ts";
import type { TestCombination } from "./testcase-generator.ts";

export class TestCaseExecutor {
  private blockedUserIdentifiers: Array<User["identifier"]> = [];

  constructor(private openApiParser: OpenAPIParser) {}

  async execute(
    testCombination: TestCombination,
    { expect, skip }: TestContext,
  ): Promise<TestResult | undefined> {
    const { user, route, expectedRequestToBeAllowed } = testCombination;
    const expected: AccessControlResult = expectedRequestToBeAllowed
      ? "permitted"
      : "denied";
    const testResult: TestResult = { user, route, expected, testResult: "❌" };

    const userHasBeenBlocked =
      user !== null &&
      this.blockedUserIdentifiers.includes(user.getCredentials().identifier);
    if (userHasBeenBlocked) {
      testResult.testResult = "⏭️";
      testResult.explanation = `Skipped, user has been blocked since a previous attempt to authenticate failed.`;
      skip(
        `User '${user}' has been blocked since a previous attempt to authenticate failed.`,
      );
      return testResult;
    }

    const isAnonymousUser = user === null;
    const credentials = isAnonymousUser ? null : user.getCredentials();
    const authenticator = this.openApiParser.getAuthenticatorByRoute(route);

    let response;
    try {
      response = await performRequest(route, authenticator, credentials);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);

        console.warn(
          `Could not impersonate user '${user}' while trying to reach route ${route.method} ${route.url}.
            This test will be skipped and further testcases for user '${user}' will be cancelled.
            Please check whether you provided correct credentials and the authentication setup is properly configured.`,
        );

        if (user !== null) {
          this.blockedUserIdentifiers.push(user.getCredentials().identifier);
        }

        testResult.testResult = "⏭️";
        testResult.explanation = `Skipped, could not impersonate user '${user}'.`;
        skip(error.message);
      }
      return testResult;
    }

    const { statusCode } = response;
    testResult.statusCode = statusCode;
    let actual: AccessControlResult =
      statusCode === HTTP_FORBIDDEN_STATUS_CODE ? "denied" : "permitted";

    if (expectedRequestToBeAllowed) {
      expect(statusCode).notToBe(HTTP_FORBIDDEN_STATUS_CODE);
      testResult.explanation = `Expected non-${HTTP_FORBIDDEN_STATUS_CODE} status code, received ${statusCode}.`;
    } else {
      if (isAnonymousUser) {
        const requestForbidden = [
          HTTP_FORBIDDEN_STATUS_CODE,
          HTTP_UNAUTHORIZED_STATUS_CODE,
        ].includes(statusCode);

        expect(requestForbidden).toBe(true);
        testResult.explanation = `Expected ${HTTP_FORBIDDEN_STATUS_CODE} or ${HTTP_UNAUTHORIZED_STATUS_CODE} status code, received ${statusCode}.`;

        actual = requestForbidden ? "denied" : "permitted";
      } else {
        testResult.explanation = `Expected ${HTTP_FORBIDDEN_STATUS_CODE}, received ${statusCode}.`;
        expect(statusCode).toBe(HTTP_FORBIDDEN_STATUS_CODE);
      }
    }

    testResult.actual = actual;
    testResult.testResult = actual === expected ? "✅" : "❌";
    return testResult;
  }
}
