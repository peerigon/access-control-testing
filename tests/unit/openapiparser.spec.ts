// tests/openapi-parser.spec.ts
import { createServer } from "node:http";
import { test } from "@japa/runner";
import { OpenAPIParser } from "../../src/core/parsers/openapi-parser.ts";
import { Resource } from "../../src/core/policy/entities/resource.js";
import openApiSpec from "../fixtures/openapi.json" with { type: "json" };

test.group("OpenAPIParser", (group) => {
  const PORT = 4000;
  const HOST = "127.0.0.1";
  const specUrl = `http://${HOST}:${PORT}/openapi.json`;
  const apiBaseUrl = "https://staging.example.com";
  let currentSpec: typeof openApiSpec;

  // todo: create more granular test groups

  group.each.setup(async () => {
    currentSpec = structuredClone(openApiSpec);
    const server = createServer((req, res) => {
      if (req.url === "/openapi.json") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(currentSpec));
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
    await OpenAPIParser.create(`http://${HOST}:1234`, apiBaseUrl);
  }).throws(/Could not retrieve given OpenApi specification/);

  test("should throw when wrong file got requested", async ({ expect }) => {
    await OpenAPIParser.create(
      `http://${HOST}:${PORT}/wrongFile.json`,
      apiBaseUrl,
    );
  }).throws(
    `The server at http://${HOST}:${PORT}/wrongFile.json did not return a valid OpenAPI specification.`,
  );

  test("should throw when provided api base url is not a valid url", async ({
    expect,
  }) => {
    await OpenAPIParser.create(specUrl, "peerigon");
  }).throws(/Invalid/);

  test("should throw when provided specification url is not a valid url", async ({
    expect,
  }) => {
    await OpenAPIParser.create("peerigon", apiBaseUrl);
  }).throws(/Invalid/);

  test("should throw when provided api base url is not existing in openapi specification", async ({
    expect,
  }) => {
    await OpenAPIParser.create(specUrl, "https://peerigon.com");
  }).throws(/not existing in the specification/);

  // todo: test for using template urls

  test("should throw when required fields are missing in specification", async ({
    expect,
  }) => {
    delete (currentSpec as any).openapi;
    await OpenAPIParser.create(specUrl, "https://peerigon.com");
  }).throws(/did not return a valid OpenAPI specification/);

  test("should throw when incorrect resource name is specified", async ({
    expect,
  }) => {
    const resources = [new Resource("User")];
    currentSpec.paths["/admin/users"].get["x-act"]["resource-name"] = "test";

    const openAPIParser = await OpenAPIParser.create(specUrl, apiBaseUrl);

    openAPIParser.validateCustomFields(resources);
  }).throws(/Expected 'User', received 'test'/);

  test("should throw when incorrect resource access is specified", async ({
    expect,
  }) => {
    const resources = [new Resource("User")];

    currentSpec.paths["/admin/users"].get["x-act"]["resource-access"] = "test";

    const openAPIParser = await OpenAPIParser.create(specUrl, apiBaseUrl);

    openAPIParser.validateCustomFields(resources);
  }).throws(
    /Expected 'create' | 'read' | 'update' | 'delete', received 'test'/,
  );

  test("should throw when incorrect resource access is specified", async ({
    expect,
  }) => {
    const resources = [new Resource("User")];

    currentSpec.paths["/admin/users"].get["x-act"]["resource-access"] = "test";

    const openAPIParser = await OpenAPIParser.create(specUrl, apiBaseUrl);

    openAPIParser.validateCustomFields(resources);
  }).throws(
    /Expected 'create' | 'read' | 'update' | 'delete', received 'test'/,
  );

  test("should throw when resource access but not resource name is specified", async ({
    expect,
  }) => {
    const resources = [new Resource("User")];

    (currentSpec.paths["/admin/users"].get["x-act"]["resource-name"] as any) =
      undefined;

    const openAPIParser = await OpenAPIParser.create(specUrl, apiBaseUrl);

    openAPIParser.validateCustomFields(resources);
  }).throws(/both 'resourceName' and 'resourceAccess' must be defined/);

  test("should throw when resource name but not resource access is specified", async ({
    expect,
  }) => {
    const resources = [new Resource("User")];

    (currentSpec.paths["/admin/users"].get["x-act"]["resource-access"] as any) =
      undefined;

    const openAPIParser = await OpenAPIParser.create(specUrl, apiBaseUrl);

    openAPIParser.validateCustomFields(resources);
  }).throws(/both 'resourceName' and 'resourceAccess' must be defined/);

  test("should throw when resource description is omitted for required parameters", async ({
    expect,
  }) => {
    const resources = [new Resource("User")];

    (currentSpec.paths["/admin/users/{id}"].get.parameters[0]["x-act"] as any) =
      undefined;

    const openAPIParser = await OpenAPIParser.create(specUrl, apiBaseUrl);

    openAPIParser.validateCustomFields(resources);
  }).throws(
    "To describe required resources in routes, both 'resourceName' and 'resourceAccess' must be defined at the same time.",
  );

  // todo: validate that there is an auth endpoint for every security scheme
  // todo: validate auth endpoint field
});
