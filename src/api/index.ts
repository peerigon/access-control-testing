import { OpenAPIParser } from "../core/parsers/openapi-parser.js";
import { Resource } from "../core/policy/entities/resource.ts";
import { User } from "../core/policy/entities/user.ts";
import {
  TestRunnerFactory,
  type TestRunnerIdentifier,
} from "../core/tests/runner/test-runner.ts";
import { TestExecutor } from "../core/tests/test-executor.ts";
import { TestcaseGenerator } from "../core/tests/testcase-generator.js";

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

  // todo: deprecate this
  public async scan() {
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

  public async generateTestCases() {
    console.log("Generating testcases...");
    const { openApiUrl, apiBaseUrl, users, resources } = this.options;

    const openAPIParser = await OpenAPIParser.create(openApiUrl, apiBaseUrl);
    openAPIParser.validateCustomFields(resources);

    const testCaseGenerator = new TestcaseGenerator(openAPIParser, users);

    return testCaseGenerator.generateTestCases({
      openApiUrl,
      apiBaseUrl,
      users,
      resources,
    });
  }
}

export { Act, User, Resource };
