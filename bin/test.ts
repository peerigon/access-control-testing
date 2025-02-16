// todo: decide on using node test runner or japa test runner
import { expect } from "@japa/expect";
import { configure, processCLIArgs, run } from "@japa/runner";

processCLIArgs(process.argv.splice(2));
configure({
  suites: [
    {
      name: "unit",
      files: ["tests/unit/**/*.spec.ts"],
    },
  ],
  plugins: [expect()],
});

void run();
