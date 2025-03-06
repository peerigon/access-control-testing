export type Expectation = (actual: unknown) => {
  toBe: (expected: unknown) => void;
  notToBe: (expected: unknown) => void;
};
export type TestCase = {
  name: string;
  test: (testContext: TestContext) => void;
};
export type TestContext = {
  expect: Expectation;
  skip: (reason?: string) => void;
};

export interface TestRunner {
  run(testCases: Array<TestCase>): void;
}
