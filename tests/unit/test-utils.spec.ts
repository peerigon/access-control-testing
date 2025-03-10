import { test } from "@japa/runner";
import { CookieJar } from "tough-cookie";
import { performRequest } from "../../src/core/tests/test-utils.ts";
import {
  createCookieAuthenticator,
  createMockServer,
  protectedRoute,
  validPassword,
  validUsername,
} from "../mock-server.ts";

console.log("test");

test.group("TestUtils", (group) => {
  group.each.setup(async () => {
    const server = createMockServer();
    await server.start();

    return async () => {
      await server.stop();
    };
  });

  test("performRequest should properly authenticate via cookie-based authentication", async ({
    expect,
  }) => {
    const response = await performRequest(
      protectedRoute,
      createCookieAuthenticator(),
      {
        identifier: validUsername,
        password: validPassword,
      },
    );

    expect(response.statusCode).toBe(200);
  });

  test("performRequest should throw when using invalid credentials", async () => {
    await performRequest(protectedRoute, createCookieAuthenticator(), {
      identifier: validUsername,
      password: "wrongpassword",
    });
  }).throws(/authentication endpoint returned a non-successful response/);

  test("performRequest should remove invalid credentials from session store", async ({
    expect,
  }) => {
    const cookieAuthenticator = createCookieAuthenticator();

    const credentials = {
      identifier: validUsername,
      password: validPassword,
    };

    // @ts-expect-error sessionStore is manipulated for testing purposes
    const sessionStore = cookieAuthenticator.sessionStore;

    const temporarySession = {
      cookies: new CookieJar(),
      isOldSession: true, // used to test if old session gets removed
    };

    sessionStore.set(credentials.identifier, temporarySession);

    const response = await performRequest(
      protectedRoute,
      cookieAuthenticator,
      credentials,
    );

    // since the existing session can't be used, it should have been removed
    // and a new one should have been created
    const session = sessionStore.get(credentials.identifier);
    expect(session).toBeDefined();
    expect(session?.cookies).toBeDefined();

    expect(session).not.toHaveProperty("isOldSession");

    expect(response.statusCode).toBe(200);
  }).disableTimeout();
});
