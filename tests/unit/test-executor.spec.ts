import { test } from "@japa/runner";

// todo: Japa types only available in NodeNext
// but then type issues with library types come up when not set to ESNext

test.group("TestExecutor", (group) => {
  test("runTests() should print a warning when using invalid credentials");
  test(
    "runTests() should print a warning when rate limiting that prevents further tests is detected",
  );
});
