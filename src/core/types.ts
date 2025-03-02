import { z } from "zod";
import type { AuthParameterLocationDescription } from "./authentication/http/types.js";
import type { OpenAPIParser } from "./parsers/openapi-parser.js";
import type { ConfigurationSchema, OpenApiPathsSchema } from "./schemas.ts";

export type Configuration = z.infer<typeof ConfigurationSchema>;
export type OpenApiPaths = z.infer<typeof OpenApiPathsSchema>;

// This is equivalent to type and scheme in OpenAPI, but we only support http bearer / http basic for now
export type AuthenticationType = "http"; // | "oauth2" | "apiKey"
export type AuthenticationScheme = "bearer" | "basic";

// or Endpoint
// what defines a Route? combination of url, method (and url params)
// todo: support url params
/*export type Route = {
  url: URL;
  method: Method;
};*/

export type AuthEndpointInformation = {
  authEndpoint: ReturnType<OpenAPIParser["getPaths"]>[0];
  authRequestParameterDescription: {
    username: AuthParameterLocationDescription;
    password: AuthParameterLocationDescription;
  };
  authResponseParameterDescription: AuthParameterLocationDescription;
};
