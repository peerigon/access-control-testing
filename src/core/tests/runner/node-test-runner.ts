import assert from "node:assert";
import { test } from "node:test";
import { TestCase } from "../testcase-generator.ts";

export const NodeTestRunner = {
  run: (testCases: Array<TestCase>) => {
    const expectation = (actual: any) => {
      return {
        toBe: (expected) => assert.strictEqual(actual, expected),
        notToBe: (expected) => assert.notStrictEqual(actual, expected),
      };
    };

    testCases.forEach((testCase) => {
      test(testCase.name, () => {
        testCase.test(expectation);
      });
    });
  },
};
