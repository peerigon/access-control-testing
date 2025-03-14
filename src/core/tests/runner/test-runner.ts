import chalk from "chalk";
import CliTable3 from "cli-table3";
import type { User } from "../../policy/entities/user.ts";
import type { RequestBody, Route } from "../test-utils.ts";

export type AccessControlResult = "permitted" | "denied";

export type TestResult = {
  user: User | null;
  route: Route;
  requestBody?: RequestBody;
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
    process.on("exit", () => {
      this.printReport();
      const failedTestCases = this.testResults.some(
        (testResult) => testResult.result === "❌",
      );
      process.exit(failedTestCases ? 1 : 0);
    });
  }

  abstract run(testCases: Array<TestCase>): Promise<void>;

  protected formatRequestBody(body: object): string {
    try {
      return chalk.cyan(JSON.stringify(body, null, 2));
    } catch {
      return chalk.red("Invalid JSON");
    }
  }

  protected printReport(): void {
    console.log("\n=== Test Report ===");

    const reportTable = new CliTable3({
      head: [
        chalk.gray("User"),
        chalk.gray("Route"),
        chalk.gray("Expected"),
        chalk.gray("Actual"),
        chalk.gray("Status Code"),
        chalk.gray("Result"),
        chalk.gray("Explanation"),
      ],
    });

    this.testResults.forEach((result) => {
      const requestInfo =
        typeof result.requestBody === "object"
          ? `${result.route}\n${this.formatRequestBody(result.requestBody)}`
          : result.route.toString();

      reportTable.push([
        result.user?.toString() ?? "anonymous",
        requestInfo,
        result.expected,
        result.actual,
        result.statusCode,
        result.result,
        result.explanation,
      ]);
    });

    console.log(reportTable.toString());

    const failedTestCases = this.testResults.filter(
      (testResult) => testResult.result === "❌",
    );

    if (failedTestCases.length > 0) {
      console.log(
        chalk.redBright(
          `${failedTestCases.length}/${this.testResults.length} test cases failed.`,
        ),
      );

      const failedUrls = new Set(
        failedTestCases.map((testResult) => testResult.route.toString()),
      );

      if (failedUrls.size > 0) {
        console.log();
        console.log(chalk.red.bold("🚨 Routes with failed test cases:"));
        failedUrls.forEach((url) => console.log(chalk.yellow(`   - ${url}`)));
      }
    } else {
      console.log(chalk.green("All test cases passed! ✅"));
    }
  }
}
