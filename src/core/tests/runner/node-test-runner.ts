import assert from "node:assert";
import { test } from "node:test";
import { TestRunner, type TestCase } from "./test-runner.ts";

const expect = (actual: unknown) => ({
  toBe: (expected: unknown) => assert.equal(actual, expected),
  notToBe: (expected: unknown) => assert.notStrictEqual(actual, expected),
});

export class NodeTestRunner extends TestRunner {
  override async run(testCases: Array<TestCase>) {
    await Promise.all(
      testCases.map((testCase) =>
        test(testCase.name, async () => {
          try {
            const testResult = await testCase.test({
              expect,
              skip: (reason) => {
                void test.skip(reason);
              },
            });

            if (testResult) {
              this.testResults.push(testResult);
            }
          } catch (error: any) {
            if (error.testResult) {
              this.testResults.push(error.testResult);
            }

            throw error;
          }
        }),
      ),
    );
  }
}
