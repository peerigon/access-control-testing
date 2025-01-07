import { z } from "zod";

const AuthenticationSchema = z.union([
  z.object({
    useOpenApi: z.literal(true),
  }),
  z.object({
    loginUrl: z.string().url(),
  }),
]);

export const ConfigurationSchema = z.object({
  openApiUrl: z.string(),
  authentication: AuthenticationSchema,
});

// todo: add stricter types
export const OpenApiPathSchema = z.object({
  path: z.string(),
  method: z.string(),
  schema: z.any(),
});

export const OpenApiPathsSchema = z.array(OpenApiPathSchema);
