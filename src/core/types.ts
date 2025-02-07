import type { Method } from "got";
import { z } from "zod";
import { AuthParameterLocationDescription } from "./authentication/http/types.js";
import { ConfigurationSchema, OpenApiPathsSchema } from "./schemas.ts";

export type Configuration = z.infer<typeof ConfigurationSchema>;
export type OpenApiPaths = z.infer<typeof OpenApiPathsSchema>;

// This is equivalent to type and scheme in OpenAPI, but we only support http bearer / http basic for now
export type AuthenticationType = "http"; // | "oauth2" | "apiKey"
export type AuthenticationScheme = "bearer" | "basic";

// or Endpoint
// what defines a Route? combination of url, method (and url params)
// todo: support url params
export type Route = {
  url: string;
  method: Method;
};

export type AuthEndpointInformation = {
  authEndpoint: ReturnType<OpenAPIParser["getPaths"]>[0];
  authRequestParameterDescription: {
    username: AuthParameterLocationDescription;
    password: AuthParameterLocationDescription;
  };
  authResponseParameterDescription: AuthParameterLocationDescription;
};
