import { createServer } from "node:http";
import { CookieAuthenticator } from "../src/core/authentication/http/cookie-authenticator.ts";
import { Route } from "../src/core/tests/test-utils.ts";
import type { AuthEndpointInformation } from "../src/core/types.ts";

const PORT = 5000;
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;

const authEndpointInfo: AuthEndpointInformation = {
  // @ts-ignore
  authEndpoint: {
    method: "post",
    path: "/login",
    // todo: supply with operation data coming from OpenAPIParser
  },
  authRequestParameterDescription: {
    identifier: {
      parameterName: "username",
      parameterLocation: "body",
    },
    password: {
      parameterName: "password",
      parameterLocation: "body",
    },
  },
  authResponseParameterDescription: {
    parameterName: "session",
    parameterLocation: "cookie",
  },
};

const validUsername = "user";
const validPassword = "password";
const validSessionId = "f48cdbd8-3fd0-4a65-8e02-4536172c0661";
const mockServer = createServer((req, res) => {
  if (req.url === "/login" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const { username, password } = JSON.parse(body);
      if (username === validUsername && password === validPassword) {
        const sessionCookie = `session=${validSessionId}`;
        res.writeHead(200, { "Set-Cookie": sessionCookie });
      } else {
        res.writeHead(401);
      }
      res.end();
    });
  } else if (req.url === "/protected") {
    const cookieHeader = req.headers.cookie;

    const isValidSessionId = cookieHeader?.includes(validSessionId);
    if (isValidSessionId) {
      res.writeHead(200);
    } else {
      res.writeHead(401);
    }

    res.end();
  } else {
    res.writeHead(404);
    res.end();
  }
});

const createCookieAuthenticator = () =>
  new CookieAuthenticator(authEndpointInfo, BASE_URL);

const startMockServer = () =>
  new Promise((resolve) => {
    mockServer.listen(PORT, HOST, void resolve);
  });

const stopMockServer = () =>
  new Promise((resolve) => {
    mockServer.close(() => resolve);
  });

const protectedRoute = new Route(new URL(`${BASE_URL}/protected`), "GET");

export {
  startMockServer,
  stopMockServer,
  createCookieAuthenticator,
  BASE_URL,
  validUsername,
  validPassword,
  validSessionId,
  protectedRoute,
};
