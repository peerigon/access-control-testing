import CliTable3 from "cli-table3";
import { User } from "../../policy/entities/user.ts";
import { Route } from "../test-utils.ts";

export type AccessControlResult = "permitted" | "denied";

export type TestResult = {
  user: User | null;
  route: Route;
  expected: AccessControlResult;
  actual?: AccessControlResult;
  result?: "✅" | "❌" | "⏭️";
  statusCode?: number;
  explanation?: string;
};

export type Expectation = (actual: unknown) => {
  toBe: (expected: unknown) => void;
  notToBe: (expected: unknown) => void;
};

export type TestCaseFunction = (
  testContext: TestContext,
) => Promise<TestResult | undefined>;

export type TestCase = {
  name: string;
  test: TestCaseFunction;
};

export type TestContext = {
  expect: Expectation;
  /**
   * Skip the current test case. For test runners that do not support skipping
   * an already running test case, an appropriate warning should be displayed.
   */
  skip: (reason?: string) => void;
};

export abstract class TestRunner {
  protected testResults: Array<TestResult> = [];

  constructor() {
    process.on("beforeExit", () => this.printReport());
  }

  abstract run(testCases: Array<TestCase>): Promise<void>;

  protected printReport(): void {
    console.log("\n=== Test Report ===");

    const table = new CliTable3({
      head: [
        "User",
        "Route",
        "Expected",
        "Actual",
        "Status Code",
        "Result",
        "Explanation",
      ],
    });

    this.testResults.forEach((result) => {
      table.push([
        result.user?.toString() ?? "anonymous",
        result.route.toString(),
        result.expected,
        result.actual,
        result.statusCode,
        result.result,
        result.explanation,
      ]);
    });

    console.log(table.toString());
    // todo: enhance this with a detailed report containing all the routes that failed
  }
}
