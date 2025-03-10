import { User } from "../../policy/entities/user";
import { Route } from "../test-utils";

type AccessControlResult = "permitted" | "denied";

export type TestResult = {
  user: User | null;
  route: Route;
  expected: AccessControlResult;
  actual?: AccessControlResult;
  testResult?: "✅" | "❌" | "⏭️";
};

export type Expectation = (actual: unknown) => {
  toBe: (expected: unknown) => void;
  notToBe: (expected: unknown) => void;
};

export type TestCase = {
  name: string;
  test: (testContext: TestContext) => Promise<TestResult | undefined>;
};

export type TestContext = {
  expect: Expectation;
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

    const transformedResults = this.testResults.map((result) => ({
      ...result,
      user: result.user?.toString() ?? "anonymous",
      route: result.route.toString(),
    }));

    console.table(transformedResults);

    // todo: enhance this with a detailed report containing all the routes that failed
  }
}
