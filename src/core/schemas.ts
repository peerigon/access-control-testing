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

export const createResourceDescriptorSchema = (
  allowedResourceNames: Array<string>,
) => {
  return z
    .object({
      resourceAccess: z.enum(["create", "read", "update", "delete"]).optional(), // todo: unify naming access/action etc.
      resourceName: z
        .enum(allowedResourceNames as [string, ...Array<string>])
        .optional(),
    })
    .refine(
      (data) =>
        (data.resourceAccess !== undefined &&
          data.resourceName !== undefined) ||
        (data.resourceAccess === undefined && data.resourceName === undefined),
      {
        message:
          "To describe resources in routes, both 'resourceName' and 'resourceAccess' must be defined at the same time.",
        path: ["resourceAccess", "resourceName"],
      },
    );
};

export const AuthFieldSchema = z
  .object({
    type: z.enum(["identifier", "password", "token"]),
  })
  .optional();
