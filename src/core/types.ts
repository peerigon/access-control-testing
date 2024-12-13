import { z } from "zod";
import { ConfigurationSchema, OpenApiPathsSchema } from "./schemas";

export type Configuration = z.infer<typeof ConfigurationSchema>;
export type OpenApiPaths = z.infer<typeof OpenApiPathsSchema>;
