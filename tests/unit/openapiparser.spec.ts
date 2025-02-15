// tests/openapi-parser.spec.ts
import { createServer } from "node:http";
import { test } from "@japa/runner";
import { OpenAPIParser } from "../../src/core/parsers/openapi-parser.ts";
import openApiSpec from "../fixtures/openapi.json" with { type: "json" };

test.group("OpenAPIParser", (group) => {
  const PORT = 4000;
  const specUrl = `http://127.0.0.1:${PORT}/`;

  group.setup(async () => {
    const server = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(openApiSpec));
    });

    await new Promise<void>((resolve) => {
      server.listen(PORT, "127.0.0.1", () => {
        console.log(`test server listens on http://127.0.0.1:${PORT}`);
        resolve();
      });
    });

    return () => {
      server.close();
    };
  });

  test("should retrieve spec from local server", async ({ expect }) => {
    const apiBaseUrl = "https://staging.example.com";
    const parser = await OpenAPIParser.create(specUrl, apiBaseUrl);
  });
});
