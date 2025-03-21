import { createServer } from "node:http";
import { test } from "@japa/runner";
import { OpenAPIParser } from "../../src/core/parsers/openapi-parser.ts";
import { Resource } from "../../src/core/policy/entities/resource.ts";
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

    return async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          }
          resolve();
        });
      });
    };
  });

  test("should retrieve spec from local server", async () => {
    const apiBaseUrl = "https://staging.example.com";
    await OpenAPIParser.create(specUrl, apiBaseUrl);
  });

  test("should throw when server serving openapi file is not reachable", async () => {
    await OpenAPIParser.create(`http://${HOST}:1234`, apiBaseUrl);
  }).throws(/Could not retrieve given OpenApi specification/);

  test("should throw when wrong file got requested", async () => {
    await OpenAPIParser.create(
      `http://${HOST}:${PORT}/wrongFile.json`,
      apiBaseUrl,
    );
  }).throws(
    `The server at http://${HOST}:${PORT}/wrongFile.json did not return a valid OpenAPI specification.`,
  );

  test("should throw when provided api base url is not a valid url", async () => {
    await OpenAPIParser.create(specUrl, "peerigon");
  }).throws(/Invalid/);

  test("should throw when provided specification url is not a valid url", async () => {
    await OpenAPIParser.create("peerigon", apiBaseUrl);
  }).throws(/Invalid/);

  test("should throw when provided api base url is not existing in openapi specification", async () => {
    await OpenAPIParser.create(specUrl, "https://peerigon.com");
  }).throws(/not existing in the specification/);

  // todo: test for using template urls

  test("should throw when required fields are missing in specification", async () => {
    delete (currentSpec as any).openapi;
    await OpenAPIParser.create(specUrl, "https://peerigon.com");
  }).throws(/did not return a valid OpenAPI specification/);

  test("should throw when incorrect resource name is specified", async () => {
    const resources = [new Resource("User")];

    // @ts-expect-error mutation of spec is expected
    currentSpec.paths["/admin/users/{id}"].get.parameters[0]["x-act"][
      "resource-name"
    ] = "test";

    const openAPIParser = await OpenAPIParser.create(specUrl, apiBaseUrl);

    openAPIParser.performCustomValidation(resources);
  }).throws(/Expected 'User', received 'test'/);

  test("should throw when incorrect resource access is specified", async () => {
    const resources = [new Resource("User")];

    // @ts-expect-error mutation of spec is expected
    currentSpec.paths["/admin/users/{id}"].get.parameters[0]["x-act"][
      "resource-access"
    ] = "test";

    const openAPIParser = await OpenAPIParser.create(specUrl, apiBaseUrl);

    openAPIParser.performCustomValidation(resources);
  }).throws(
    /Expected 'create' | 'read' | 'update' | 'delete', received 'test'/,
  );

  test("should throw when resource access but not resource name is specified", async () => {
    const resources = [new Resource("User")];

    // @ts-expect-error mutation of spec is expected
    (currentSpec.paths["/admin/users/{id}"].get.parameters[0]["x-act"][
      "resource-name"
    ] as any) = undefined;

    const openAPIParser = await OpenAPIParser.create(specUrl, apiBaseUrl);

    openAPIParser.performCustomValidation(resources);
  }).throws(
    /both 'x-act-resource-name' and 'x-act-resource-access' must be defined/,
  );

  test("should throw when resource name but not resource access is specified", async () => {
    const resources = [new Resource("User")];

    // @ts-expect-error mutation of spec is expected
    currentSpec.paths["/admin/users/{id}"].get.parameters[0]["x-act"][
      "resource-access"
    ] = undefined;

    const openAPIParser = await OpenAPIParser.create(specUrl, apiBaseUrl);

    openAPIParser.performCustomValidation(resources);
  }).throws(
    /both 'x-act-resource-name' and 'x-act-resource-access' must be defined/,
  );

  test("should throw when resource description is omitted for required parameters", async () => {
    const resources = [new Resource("User")];

    // @ts-expect-error mutation of spec is expected
    currentSpec.paths["/admin/users/{id}"].get.parameters[0]["x-act"] =
      undefined;

    const openAPIParser = await OpenAPIParser.create(specUrl, apiBaseUrl);

    openAPIParser.performCustomValidation(resources);
  }).throws(
    /To describe required resources in routes, both 'x-act-resource-name' and 'x-act-resource-access' must be defined at the same time./,
  ); // todo: also check for "Parameter 'id' in path '/admin/users/{id}' must be annotated properly."

  test("should throw when resource name is invalid in request body property", async () => {
    const resources = [new Resource("User")];

    currentSpec.paths["/admin/users"].patch.requestBody.content[
      "application/json"
    ].schema.properties.id["x-act"]["resource-name"] = "test";

    const openAPIParser = await OpenAPIParser.create(specUrl, apiBaseUrl);

    openAPIParser.performCustomValidation(resources);
  }).throws(/Expected 'User', received 'test'/);

  test("should properly combine api base url containing path with given path", async ({
    expect,
  }) => {
    const apiBaseUrlWithPath = "https://staging.example.com/api/";

    const openAPIParser = await OpenAPIParser.create(
      specUrl,
      apiBaseUrlWithPath,
    );

    const combinedUrl = openAPIParser.constructFullApiUrl("/users");
    expect(combinedUrl.toString()).toBe(
      "https://staging.example.com/api/users",
    );
  });

  test("should throw when multiple combined security schemes are defined for an operation", async () => {
    const resources = [new Resource("User")];

    (currentSpec.paths["/admin/users"].get.security as any) = [
      {
        basicHttpAuthentication: [],
        bearerHttpAuthentication: [],
      },
      {
        bearerHttpAuthentication: [],
        cookieAuthentication: [],
      },
    ];

    const openAPIParser = await OpenAPIParser.create(specUrl, apiBaseUrl);

    openAPIParser.performCustomValidation(resources);
  }).throws(
    /Combined security schemes where more than one security scheme has to be used for authentication are not supported./,
  );

  // todo: validate that there is an auth endpoint for every security scheme
  // todo: validate auth endpoint field
});
