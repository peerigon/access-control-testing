import { BaseReporter } from "@japa/runner/core";

export class TestReporter extends BaseReporter {
  static name = "custom";

  async start() {
    console.log("starting");
  }
  async end() {
    if (!this.runner) return;

    const summary = this.runner.getSummary();
    await this.printSummary(summary);
  }
}
