// tests/openapi-parser.spec.ts
import { createServer } from "node:http";
import { test } from "@japa/runner";
import { OpenAPIParser } from "../../src/core/parsers/openapi-parser.ts";
import openApiSpec from "../fixtures/openapi.json" with { type: "json" };

test.group("OpenAPIParser", (group) => {
  const PORT = 4000;
  const HOST = "127.0.0.1";
  const specUrl = `http://${HOST}:${PORT}/openapi.json`;

  group.setup(async () => {
    const server = createServer((req, res) => {
      if (req.url === "/openapi.json") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(openApiSpec));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(PORT, HOST, () => {
        console.log(`test server listens on http://${HOST}:${PORT}`);
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

  test("should throw when server serving openapi file is not reachable", async ({
    expect,
  }) => {
    const apiBaseUrl = "https://staging.example.com";
    await OpenAPIParser.create(`http://${HOST}:1234`, apiBaseUrl);
  }).throws(/Could not retrieve given OpenApi specification/);

  test("should throw when wrong file got requested", async ({ expect }) => {
    const apiBaseUrl = "https://staging.example.com";
    await OpenAPIParser.create(
      `http://${HOST}:${PORT}/wrongFile.json`,
      apiBaseUrl,
    );
  }).throws(
    `The server at http://${HOST}:${PORT}/wrongFile.json did not return a valid OpenAPI specification.`,
  );
});
