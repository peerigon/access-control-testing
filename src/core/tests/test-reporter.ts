import { BaseReporter } from "@japa/runner/core";
import type { TestCase } from "./testcase-generator.ts";

// todo: clarify how test report will work
export class TestReporter extends BaseReporter {
  static name = "custom";

  onTestEnd(testPayload: any) {
    const { hasError: testFailed } = testPayload;

    const testStateRepresentation = testFailed ? "❌" : "✅";
    const testDataset: TestCase = testPayload.dataset.row;

    const { route, user, expectedRequestToBeAllowed } = testDataset;
    const { url, method } = route;

    const requestRepresentation = `[${method.toUpperCase()}] ${url}`;

    if (testFailed) {
      const errorDetails = testPayload.errors?.[0]?.error?.matcherResult;

      const actual = errorDetails?.actual ?? "Unknown";
      const expected = errorDetails?.expected ?? "Unknown";

      console.log(`
===========================================
 ${testStateRepresentation} ${requestRepresentation}
===========================================
Test Status:        ${testStateRepresentation}
Request:            ${requestRepresentation}
User:               ${user}
Expection:          ${expectedRequestToBeAllowed ? "Should have been allowed" : "Should have been denied"}
-------------------------------------------
Actual status:      ${actual}
Expected status:    ${expected}
===========================================
`);
    } else {
      // todo: only print this when successful for every user in this route
      console.log(`
===========================================
 ${testStateRepresentation} ${requestRepresentation}
===========================================
`);
    }
  }

  async start() {
    console.log("starting");
  }
  async end() {
    if (!this.runner) return;

    const summary = this.runner.getSummary();

    console.log(`Finished tests in ${summary.duration}ms`);
    // await this.printSummary(summary);
  }
}
