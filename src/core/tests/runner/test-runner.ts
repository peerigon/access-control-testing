import { NodeTestRunner } from "./node-test-runner.ts";

export type Expectation = {
  toBe: (expected: any) => void;
  notToBe: (expected: any) => void;
}

export type TestContext = {
  skip: (reason?: string) => void;
}

// todo: expose TestRunner in api so a custom test-runner can be used when implementing this interface
export type TestRunner = {
  group: (name: string, callback: () => void) => void;
  test: (name: string, callback: (t: TestContext) => Promise<void> | void) => void;
  expect: (actual: any) => Expectation;
};

export type TestRunnerIdentifier = "node" | "jest";

const DEFAULT_TEST_RUNNER = "node";
export const TestRunnerFactory = {
  createTestRunner(
    runner: TestRunnerIdentifier = DEFAULT_TEST_RUNNER,
  ): TestRunner {
    switch (runner) {
      case "node": {
        return new NodeTestRunner();
      }
      /*case "jest":
        return new JestTestRunner();
      case "japa":
        return new JapaTestRunner();*/
      default: {
        throw new Error(`Unsupported test runner: ${runner}`);
      }
    }
  },
};
