import { apiClient } from "@japa/api-client";
import { expect } from "@japa/expect";
import { configure, run } from "@japa/runner";

export class Act {
  private async runTests() {
    // todo: set manually, not via cli args
    // processCLIArgs(process.argv.splice(2));
    configure({
      suites: [
        {
          name: "accesscontrol",
          timeout: 30 * 1000,
          files: ["tests/browser/accesscontrol.spec.ts"],
        },
      ],
      // todo: make base url configurable as param
      // read the value from a config prop or the OpenAPI spec
      plugins: [expect(), apiClient("http://localhost:3333")],
    });

    void run();
  }

  public async scan() {
    console.log("Scanning...");

    await this.runTests();
  }
}
