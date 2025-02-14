import { Resource } from "../core/policy/entities/resource.ts";
import { User } from "../core/policy/entities/user.ts";
import { TestExecutor } from "../core/tests/test-executor.ts";

class Act {
  private readonly baseUrl: URL;

  // todo: maybe move all the configuration stuff from the file to the constructor?
  constructor(baseUrlString: string) {
    try {
      this.baseUrl = new URL(baseUrlString);
    } catch (error) {
      throw new Error("Invalid base URL");
    }
  }

  public async scan() {
    console.log("Scanning...");

    const testExecutor = new TestExecutor();
    await testExecutor.runTests();
  }
}

export { Act, User, Resource };
