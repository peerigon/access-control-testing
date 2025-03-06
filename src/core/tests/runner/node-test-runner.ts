import assert from "node:assert";
import { test } from "node:test";
import { TestRunner } from "./test-runner.ts";

export const NodeTestRunner: TestRunner = {
  run: (testCases) => {
    const expect = (actual: unknown) => ({
      toBe: (expected: unknown) => assert.strictEqual(actual, expected),
      notToBe: (expected: unknown) => assert.notStrictEqual(actual, expected),
    });

    testCases.forEach((testCase) => {
      test(testCase.name, () => {
        testCase.test({
          expect,
          skip: (reason) => {
            test.skip(reason);
          },
        });
      });
    });
  },
};
