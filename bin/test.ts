import { apiClient } from "@japa/api-client";
import { expect } from "@japa/expect";
import { configure, processCLIArgs, run } from "@japa/runner";

processCLIArgs(process.argv.splice(2));
configure({
  suites: [
    {
      name: "browser",
      timeout: 30 * 1000,
      files: ["tests/browser/**/*.spec.ts"],
    },
    {
      name: "unit",
      files: ["tests/unit/**/*.spec.ts"],
    },
  ],
  // todo: make base url configurable as param
  // read the value from a config prop or the OpenAPI spec
  plugins: [expect(), apiClient("https://localhost:3333")],
});

void run();
