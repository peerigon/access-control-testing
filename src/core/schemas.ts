import { z, ZodError, ZodSchema, type ZodIssue } from "zod";

export const createResourceDescriptorSchema = ({
  allowedResourceNames,
  descriptorsRequired = false,
}: {
  allowedResourceNames: Array<string>;
  descriptorsRequired?: boolean;
}) => {
  const resourceAccessSchema = z.enum(["create", "read", "update", "delete"]);
  const resourceNameSchema = z.enum(
    allowedResourceNames as [string, ...Array<string>],
  );

  return z
    .object({
      resourceAccess: descriptorsRequired
        ? resourceAccessSchema
        : resourceAccessSchema.optional(),
      resourceName: descriptorsRequired
        ? resourceNameSchema
        : resourceNameSchema.optional(),
    })
    .refine(
      (data) => {
        const bothOrOneIsMissing =
          (data.resourceAccess === undefined &&
            data.resourceName === undefined) ||
          (data.resourceAccess !== undefined &&
            data.resourceName !== undefined);

        return bothOrOneIsMissing;
      },
      {
        path: ["resourceAccess", "resourceName"],
      },
    );
};

export const AuthFieldSchema = z
  .object({
    type: z.enum(["identifier", "password", "token"]),
  })
  .optional();

// from https://stackoverflow.com/a/76642589/13156621
const formatZodIssue = (issue: ZodIssue): string => {
  const { path, message } = issue;
  const pathString = path.join(".");

  return `${pathString}: ${message}`;
};

const formatZodError = (error: ZodError, prefix: string): string => {
  const { issues } = error;
  if (issues[0] === undefined) return prefix;

  const firstIssue = formatZodIssue(issues[0]);
  const additionalIssuesHint =
    issues.length > 1 ? ` (and ${issues.length - 1} more issues)` : "";

  return `${prefix}\n\n${firstIssue}${additionalIssuesHint}`;
};

export const parseZodSchema = <SchemaType>(
  schema: ZodSchema<SchemaType>,
  data: unknown,
  prefix = "An error occurred while trying to parse the provided data.",
): SchemaType => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new TypeError(formatZodError(error, prefix));
    }
    throw error;
  }
};
