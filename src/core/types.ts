import { z } from "zod";
import { ConfigurationSchema, OpenApiPathsSchema } from "./schemas";

export type Configuration = z.infer<typeof ConfigurationSchema>;
export type OpenApiPaths = z.infer<typeof OpenApiPathsSchema>;

// This is equivalent to type and scheme in OpenAPI, but we only support http bearer / http basic for now
export type AuthenticationType = "http"; // | "oauth2" | "apiKey"
export type AuthenticationScheme = "bearer" | "basic";
