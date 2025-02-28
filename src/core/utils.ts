import ObjectSet from "object-set-type";
import { OPENAPI_FIELD_PREFIX, OpenApiFieldNames } from "./constants.js";
import { AuthFieldSchema } from "./schemas.js";

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/*type Prefix<Prefix extends string, String extends string> = `${Prefix}${String}`;
type OpenApiFieldValues = (typeof OpenApiFieldNames)[keyof typeof OpenApiFieldNames]
{ "x-act": Record<OpenApiFieldValues, unknown> | undefined} & Record<Prefix<OPENAPI_FIELD_PREFIX, OpenApiFieldValues>, unknown>*/
// todo: recheck type for fieldIdentifier
/**
 * Returns the value of the OpenAPI field with the given field identifier
 *
 * @param object The object to get the OpenAPI field from
 * @param fieldIdentifier The field identifier of the OpenAPI field to get
 */
export function getOpenApiField(
  object: Record<string, any> | undefined,
  fieldIdentifier: (typeof OpenApiFieldNames)[keyof typeof OpenApiFieldNames],
) {
  if (object === undefined) {
    return undefined;
  }

  // object[x-act-{fieldIdentifier}]
  const fieldValueInlined =
    object[`${OPENAPI_FIELD_PREFIX}-${fieldIdentifier}`];

  // object[x-act.{fieldIdentifier}]
  const fieldValueNested = object[OPENAPI_FIELD_PREFIX]?.[fieldIdentifier];

  return fieldValueInlined ?? fieldValueNested;
}

export function parseOpenApiAuthField(object: Record<string, any> | undefined) {
  const fieldValue = getOpenApiField(object, OpenApiFieldNames.AUTH_FIELD);

  // todo: better error handling
  return AuthFieldSchema.parse(fieldValue);
}

// todo: create parser function for resource access & resource name
// resource name would be a dynamic type calculated at runtime

export function removeObjectDuplicatesFromArray<ArrayItemType>(
  array: Array<ArrayItemType>,
) {
  return [...new ObjectSet(array)];
}
