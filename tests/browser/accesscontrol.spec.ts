import { test } from "@japa/runner";

test.group("Access Control Testing", (group) => {
  group.each.setup(() => {
    console.log("executed before the test");
  });

  group.each.teardown(() => {
    console.log("executed after the test");
  });

  test("has docs for browser client", async ({ visit }: { visit: any }) => {
    const page = await visit("https://japa.dev/docs");
    await page.getByRole("link", { name: "Browser client" }).click();

    /**
     * Assertions
     */
    await page.assertPath("/docs/introduction");
    await page.assertTextContains("body", "Browser client");
  });

  test("add two or more numbers", () => {
    console.log("TEST 2 - executed in the test");
  });
});
