import assert from "node:assert";
import { test } from "node:test";
import type { TestRunner } from "./test-runner.ts";

const expect = (actual: unknown) => ({
  toBe: (expected: unknown) => assert.strictEqual(actual, expected),
  notToBe: (expected: unknown) => assert.notStrictEqual(actual, expected),
});

export const NodeTestRunner: TestRunner = {
  run: (testCases) => {
    testCases.forEach((testCase) => {
      void test(testCase.name, () => {
        testCase.test({
          expect,
          skip: (reason) => {
            void test.skip(reason);
          },
        });
      });
    });
  },
};
