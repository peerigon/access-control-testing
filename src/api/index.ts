import { apiClient } from "@japa/api-client";
import { expect } from "@japa/expect";
import { configure, run } from "@japa/runner";
import { Resource } from "../core/policy/entities/resource.ts";
import { User } from "../core/policy/entities/user.ts";
import { TestReporter } from "../core/tests/test-reporter.ts";

class Act {
  get baseUrl(): URL {
    return this._baseUrl;
  }
  private readonly _baseUrl: URL;

  // todo: maybe move all the configuration stuff from the file to the constructor?
  constructor(baseUrlString: string) {
    try {
      this._baseUrl = new URL(baseUrlString);
    } catch (error) {
      throw new Error("Invalid base URL");
    }
  }

  private async runTests() {
    configure({
      reporters: {
        activated: [TestReporter.name],
        list: [
          {
            name: TestReporter.name,
            handler: (...args: unknown[]) => new TestReporter().boot(...args),
          },
        ],
      },
      suites: [
        {
          name: "accesscontrol",
          timeout: 30 * 1000,
          files: ["tests/accesscontrol.spec.ts"],
        },
      ],
      // todo: make base url configurable as param
      // read the value from a config prop or the OpenAPI spec
      plugins: [expect(), apiClient(this._baseUrl.toString())],
    });

    await run();
  }

  public async scan() {
    console.log("Scanning...");

    await this.runTests();
  }
}

export { Act, User, Resource };
