import { Resource } from "../core/policy/entities/resource.ts";
import { User } from "../core/policy/entities/user.ts";
import { TestExecutor } from "../core/tests/test-executor.ts";

type ActOptions = { apiBaseUrl: string; openApiUrl: string };
class Act {
  // todo: maybe move all the configuration stuff from the file to the constructor?
  constructor(private readonly options: ActOptions) {
    // todo: check if both are valid urls
  }

  public async scan() {
    console.log("Scanning...");

    const testExecutor = new TestExecutor();
    await testExecutor.runTests(
      this.options.openApiUrl,
      this.options.apiBaseUrl,
    );
  }
}

export { Act, User, Resource };
