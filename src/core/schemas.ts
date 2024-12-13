import { z } from "zod";

export const ConfigurationSchema = z.object({
  openApiUrl: z.string(),
});

// todo: add stricter types
export const OpenApiPathSchema = z.object({
  path: z.string(),
  method: z.string(),
  schema: z.any(),
});

export const OpenApiPathsSchema = z.array(OpenApiPathSchema);
