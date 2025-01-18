import { apiClient } from "@japa/api-client";
import { expect } from "@japa/expect";
import { configure, run } from "@japa/runner";
import { Resource } from "../core/entities/resource";
import { User } from "../core/entities/user";

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
