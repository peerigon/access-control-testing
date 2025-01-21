import { BaseReporter } from "@japa/runner/core";
import type { TestDataset } from "./testcase-generator";

export class TestReporter extends BaseReporter {
  static name = "custom";

  onTestEnd(testPayload) {
    // for now, only print tests with error
    // todo: maybe also print a small summary for successful tests?
    if (testPayload.hasError) {
      // todo: why does type assertion not work?
      const testDataset: TestDataset = testPayload.dataset.row;

      const { route, user, expectedRequestToBeAllowed } = testDataset;
      const { url, method } = route;

      const testStateRepresentation = testPayload.hasError ? "❌" : "✅";
      const requestRepresentation = `[${method.toUpperCase()}] ${url}`;
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
