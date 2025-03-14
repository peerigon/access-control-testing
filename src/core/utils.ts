import ObjectSet from "object-set-type";
import { OPENAPI_FIELD_PREFIX, OpenApiFieldNames } from "./constants.ts";
import { AuthFieldSchema } from "./schemas.ts";

export const isValidUrl = (url: string) => {
  try {
    /*
    side effect is wanted here to catch errors thrown by the URL constructor
    to determine if the URL is valid
    */
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Returns the value of the OpenAPI field with the given field identifier
 *
 * @param object The object to get the OpenAPI field from
 * @param fieldIdentifier The field identifier of the OpenAPI field to get
 */
export const getOpenApiField = (
  object: Record<string, any> | undefined,
  fieldIdentifier: (typeof OpenApiFieldNames)[keyof typeof OpenApiFieldNames],
) => {
  if (object === undefined) {
    return undefined;
  }

  // object[x-act-{fieldIdentifier}]
  const fieldValueInlined: unknown =
    object[`${OPENAPI_FIELD_PREFIX}-${fieldIdentifier}`];

  // object[x-act.{fieldIdentifier}]
  const fieldValueNested: unknown =
    object[OPENAPI_FIELD_PREFIX]?.[fieldIdentifier];

  return fieldValueInlined ?? fieldValueNested;
};

export const parseOpenApiAuthField = (
  object: Record<string, any> | undefined,
) => {
  const fieldValue = getOpenApiField(object, OpenApiFieldNames.AUTH_FIELD);

  // todo: better error handling
  return AuthFieldSchema.parse(fieldValue);
};

// todo: create parser function for resource access & resource name
// resource name would be a dynamic type calculated at runtime

export const removeObjectDuplicatesFromArray = <ArrayItemType>(
  array: Array<ArrayItemType>,
) => [...new ObjectSet(array)];

export const removeTrailingSlash = (str: string): string => {
  return str.endsWith("/") ? str.slice(0, -1) : str;
};

export const removeLeadingSlash = (str: string): string => {
  return str.startsWith("/") ? str.slice(1) : str;
};
