import { createServer } from "node:http";
import { CookieAuthenticator } from "../src/core/authentication/http/cookie-authenticator.js";
import { AuthEndpointInformation } from "../src/core/types.js";

const PORT = 5000;
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;

const authEndpointInfo: AuthEndpointInformation = {
  authEndpoint: {
    method: "post",
    path: "/login",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              username: {
                type: "string",
                format: "email",
                description: "E-Mail-Adresse des Benutzers",
                example: "user@example.com",
                "x-act-auth-field": {
                  type: "identifier",
                },
              },
              password: {
                type: "string",
                format: "password",
                example: "secretpassword",
                description: "Passwort des Benutzers",
                "x-act-auth-field": {
                  type: "password",
                },
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Login erfolgreich",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  example: "Login erfolgreich",
                },
              },
            },
          },
        },
      },
      "400": {
        description: "Ungültige Anmeldedaten",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                errors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Invalid user credentials",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "x-act-auth-endpoint": "cookieAuthentication",
  },
  authRequestParameterDescription: {
    username: {
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
    console.log("requrl", req.url);
    res.writeHead(404);
    res.end();
  }
});

const createCookieAuthenticator = () =>
  new CookieAuthenticator(authEndpointInfo, BASE_URL);

const startMockServer = () =>
  new Promise((resolve) => mockServer.listen(PORT, HOST, resolve));
const stopMockServer = () =>
  new Promise((resolve) => mockServer.close(() => resolve));

export {
  startMockServer,
  stopMockServer,
  createCookieAuthenticator,
  BASE_URL,
  validUsername,
  validPassword,
  validSessionId,
};
