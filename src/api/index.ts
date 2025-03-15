import { OpenAPIParser } from "../core/parsers/openapi-parser.ts";
import { Resource } from "../core/policy/entities/resource.ts";
import { User } from "../core/policy/entities/user.ts";
import { type TestCase } from "../core/tests/runner/test-runner.ts";
import { TestCaseGenerator } from "../core/tests/test-case-generator.ts";

type ActOptions = {
  apiBaseUrl: string;
  openApiUrl: string;
  users: Array<User>;
  resources: Array<Resource>;
};

class Act {
  constructor(private readonly options: ActOptions) {
    // todo: check if both are valid urls
  }

  async generateTestCases(): Promise<Array<TestCase>> {
    console.log("Generating testcases...");
    const { openApiUrl, apiBaseUrl, users, resources } = this.options;

    const openAPIParser = await OpenAPIParser.create(openApiUrl, apiBaseUrl);
    openAPIParser.performCustomValidation(resources);

    const testCaseGenerator = new TestCaseGenerator(openAPIParser, users);
    return testCaseGenerator.generateTestCases();
  }
}

export { Act };
export { User } from "../core/policy/entities/user.ts";
export { Resource } from "../core/policy/entities/resource.ts";
export { NodeTestRunner } from "../core/tests/runner/node-test-runner.ts";
export { TestRunner } from "../core/tests/runner/test-runner.ts";
