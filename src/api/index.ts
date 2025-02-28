import { Resource } from "../core/policy/entities/resource.ts";
import { User } from "../core/policy/entities/user.ts";
import {
  TestRunnerFactory,
  type TestRunnerIdentifier,
} from "../core/tests/runner/test-runner.ts";
import { TestExecutor } from "../core/tests/test-executor.ts";

type ActOptions = {
  apiBaseUrl: string;
  openApiUrl: string;
  users: Array<User>;
  resources: Array<Resource>;
  testRunner?: TestRunnerIdentifier;
};
class Act {
  constructor(private readonly options: ActOptions) {
    // todo: check if both are valid urls
  }

  async scan() {
    console.log("Scanning...");

    const testRunner = this.options.testRunner
      ? TestRunnerFactory.createTestRunner(this.options.testRunner)
      : TestRunnerFactory.createTestRunner();

    const testExecutor = new TestExecutor();
    await testExecutor.runTests(
      testRunner,
      this.options.openApiUrl,
      this.options.apiBaseUrl,
      this.options.users,
      this.options.resources,
    );
  }
}

export { Act,   };

export {User} from "../core/policy/entities/user.ts";
export {Resource} from "../core/policy/entities/resource.ts";