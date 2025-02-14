import assert from "node:assert";
import { describe, it } from "node:test";
import { Expectation, TestRunner } from "./test-runner.ts";

export class NodeTestRunner implements TestRunner {
  group(name: string, callback: () => void) {
    describe(name, callback);
  }

  test(name: string, callback: () => Promise<void> | void) {
    it(name, callback);
  }

  expect(actual: any): Expectation {
    return {
      toBe: (expected) => assert.strictEqual(actual, expected),
      notToBe: (expected) => assert.notStrictEqual(actual, expected),
      toContain: (expected) =>
        assert.strictEqual(actual.contains(expected), true),
    };
  }
}
