import { z } from "zod";
import { ConfigurationSchema } from "./schemas";

export type Configuration = z.infer<typeof ConfigurationSchema>;
