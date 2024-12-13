import { z } from "zod";

export const ConfigurationSchema = z.object({
  openApiUrl: z.string(),
});
