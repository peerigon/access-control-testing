import { test } from "@japa/runner";

test("has docs for browser client", async ({ visit }: { visit: any }) => {
  const page = await visit("https://japa.dev/docs");
  await page.getByRole("link", { name: "Browser client" }).click();

  /**
   * Assertions
   */
  await page.assertPath("/docs/introduction");
  await page.assertTextContains("body", "Browser client");
});
