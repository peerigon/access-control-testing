import { test } from "@japa/runner";
// todo: Japa types only available in NodeNext
// but then type issues with library types come up when not set to ESNext
import { performRequest } from "../../src/core/tests/test-utils.ts";
import {
  BASE_URL,
  createCookieAuthenticator,
  startMockServer,
  stopMockServer,
  validPassword,
  validUsername,
} from "../mock-server.ts";

test.group("TestUtils", (group) => {
  group.setup(async () => {
    await startMockServer();

    return async () => stopMockServer();
  });

  test("performRequest should properly authenticate via cookie-based authentication", async ({
    expect,
  }) => {
    const route = {
      url: new URL(`${BASE_URL}/protected`),
      method: "GET",
    };

    const response = await performRequest(route, createCookieAuthenticator(), {
      identifier: validUsername,
      password: validPassword,
    });

    expect(response.statusCode).toBe(200);
  });

  test("performRequest should have 401 status code as response when using invalid credentials", async ({
    expect,
  }) => {
    const route = { url: new URL(`${BASE_URL}/protected`), method: "GET" };

    const response = await performRequest(route, createCookieAuthenticator(), {
      identifier: validUsername,
      password: "wrongpassword",
    });

    expect(response.statusCode).toBe(401);
  }).disableTimeout();
});
