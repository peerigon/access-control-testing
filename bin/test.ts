import { browserClient } from "@japa/browser-client";
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
  plugins: [expect(), browserClient({ runInSuites: ["browser"] })],
});

run();
