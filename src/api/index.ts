import { OpenAPIParser } from "../core/parsers/openapi-parser.js";
import { Resource } from "../core/policy/entities/resource.ts";
import { User } from "../core/policy/entities/user.ts";
import { TestcaseGenerator } from "../core/tests/testcase-generator.ts";

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

  public async generateTestCases() {
    console.log("Generating testcases...");
    const { openApiUrl, apiBaseUrl, users, resources } = this.options;

    const openAPIParser = await OpenAPIParser.create(openApiUrl, apiBaseUrl);
    openAPIParser.validateCustomFields(resources);

    const testCaseGenerator = new TestcaseGenerator(openAPIParser, users);
    return testCaseGenerator.generateTestCases();
  }
}

export { Act, User, Resource };
