import { OPENAPI_FIELD_PREFIX, OpenApiFieldNames } from "./constants.js";

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/*type Prefix<Prefix extends string, String extends string> = `${Prefix}${String}`;
type OpenApiFieldValues = (typeof OpenApiFieldNames)[keyof typeof OpenApiFieldNames]
{ "x-act": Record<OpenApiFieldValues, unknown> | undefined} & Record<Prefix<OPENAPI_FIELD_PREFIX, OpenApiFieldValues>, unknown>*/
// todo: recheck type for fieldIdentifier
/**
 * Returns the value of the OpenAPI field with the given field identifier
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
