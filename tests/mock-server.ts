import { serve, type ServerType } from "@hono/node-server";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { CookieAuthenticator } from "../src/core/authentication/http/cookie-authenticator.ts";
import { Route } from "../src/core/tests/test-utils.ts";
import type { AuthEndpointInformation } from "../src/core/types.ts";

const PORT = 4999;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const authEndpointInfo: AuthEndpointInformation = {
  authEndpoint: {
    method: "post",
    path: "/login",
  } as any, // todo: fix the type of authEndpoint to be an Operation
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

class MockServer {
  private app: Hono;
  private server: ServerType | null = null;

  constructor() {
    this.app = new Hono();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.post("/login", async (c) => {
      const { username, password } = await c.req.json();

      if (username === validUsername && password === validPassword) {
        setCookie(c, "session", validSessionId, { path: "/", httpOnly: true });
        return c.text("Login successful", 200);
      }

      return c.text("Unauthorized", 401);
    });

    this.app.get("/protected", async (c) => {
      const session = getCookie(c, "session");

      if (session === validSessionId) {
        return c.text("Access granted", 200);
      }

      return c.text("Unauthorized", 401);
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = serve({
        fetch: this.app.fetch,
        port: PORT,
      });

      console.log(`Mock server listens on ${BASE_URL}`);
      this.server.on("listening", () => {
        setTimeout(() => {
          resolve();
        }, 0); // todo: figure out if this works reliably, also try to find a better solution
      });

      this.server.on("error", (error: Error) => {
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise<void>((resolve, reject) => {
        this.server!.close((err) => {
          console.log("Mock server stopped");
          if (err) {
            return reject(err);
          }
          this.server = null;
          resolve();
        });
      });
    }
  }
}

// **Exportiere Factory-Funktionen für einfachere Nutzung**
const createMockServer = () => new MockServer();
const createCookieAuthenticator = () =>
  new CookieAuthenticator(authEndpointInfo, BASE_URL);

const protectedRoute = new Route(new URL(`${BASE_URL}/protected`), "GET");

export {
  createMockServer,
  createCookieAuthenticator,
  BASE_URL,
  validUsername,
  validPassword,
  validSessionId,
  protectedRoute,
};
