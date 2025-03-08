import assert from "node:assert";
import { describe, it } from "node:test";
import type { Expectation, TestRunner } from "./test-runner.ts";

export class NodeTestRunner implements TestRunner {
  group(name: string, callback: () => void) {
    void describe(name, callback);
  }

  test(
    name: string,
    callback: (t: { skip: (reason?: string) => void }) => Promise<void> | void,
  ) {
    void it(name, async (t) =>
      callback({ skip: (reason?: string) => t.skip(reason) }),
    );
  }

  expect(actual: any): Expectation {
    return {
      toBe: (expected) => assert.strictEqual(actual, expected),
      notToBe: (expected) => assert.notStrictEqual(actual, expected),
    };
  }
}
