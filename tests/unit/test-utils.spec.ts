import { test } from "@japa/runner";
import { CookieJar } from "tough-cookie";
// todo: Japa types only available in NodeNext
// but then type issues with library types come up when not set to ESNext
import { performRequest } from "../../src/core/tests/test-utils.ts";
import {
  createCookieAuthenticator,
  protectedRoute,
  startMockServer,
  stopMockServer,
  validPassword,
  validUsername,
} from "../mock-server.ts";

test.group("TestUtils", (group) => {
  group.setup(async () => {
    await startMockServer();

    return async () => await stopMockServer();
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
  })
    .throws(/authentication endpoint returned a non-successful response/)
    .disableTimeout();

  test("performRequest should remove invalid credentials from session store", async ({
    expect,
  }) => {
    const cookieAuthenticator = createCookieAuthenticator();

    const credentials = {
      identifier: validUsername,
      password: validPassword,
    };

    // @ts-expect-error
    const sessionStore = cookieAuthenticator.sessionStore;
    sessionStore.set(credentials.identifier, {
      cookies: new CookieJar(),
      isOldSession: true, // used to test if old session gets removed
    });

    await performRequest(protectedRoute, cookieAuthenticator, credentials);

    // since the existing session can't be used, it should have been removed
    // and a new one should have been created
    const session = sessionStore.get(credentials.identifier);
    expect(session).toBeDefined();
    expect(session?.cookies).toBeDefined();
    expect(session?.isOldSession).toBeUndefined();
  }).disableTimeout();
});
