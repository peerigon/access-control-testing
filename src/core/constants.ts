export const TOOL_NAME = "act";
const OPENAPI_FIELD_PREFIX = `x-${TOOL_NAME}`;
export const OpenApiFieldNames: Record<string, string> = {
  RESOURCE_NAME: "resource-name",
  RESOURCE_ACCESS: "resource-access",
  AUTH_ENDPOINT: "auth-endpoint",
  AUTH_FIELD: "auth-field",
};

/*// todo: make fields visible for auto-completion, e.g. add extra type information
export const OpenApiFields = new Proxy(OpenApiFieldNames, {
  get(target, prop) {
    if (prop in target && typeof prop === "string") {
      const fieldName = target[prop];
      return OPENAPI_FIELD_PREFIX + fieldName;
    }
    return null;
  },
});*/

/*type Prefix<Prefix extends string, String extends string> = `${Prefix}${String}`;
type OpenApiFieldValues = (typeof OpenApiFieldNames)[keyof typeof OpenApiFieldNames]
{ "x-act": Record<OpenApiFieldValues, unknown> | undefined} & Record<Prefix<OPENAPI_FIELD_PREFIX, OpenApiFieldValues>, unknown>*/
// todo: recheck type for fieldIdentifier
// todo: move this to an utils file or somewhere else
/**
 * Returns the value of the OpenAPI field with the given field identifier
 * @param object The object to get the OpenAPI field from
 * @param fieldIdentifier The field identifier of the OpenAPI field to get
 */
export function getOpenApiField(
  object: Record<string, any>,
  fieldIdentifier: (typeof OpenApiFieldNames)[keyof typeof OpenApiFieldNames],
) {
  // object[x-act-{fieldIdentifier}]
  const fieldValueInlined =
    object[`${OPENAPI_FIELD_PREFIX}-${fieldIdentifier}`];

  // object[x-act.{fieldIdentifier}]
  const fieldValueNested = object[OPENAPI_FIELD_PREFIX]?.[fieldIdentifier];

  return fieldValueInlined ?? fieldValueNested;
}

export const HTTP_FORBIDDEN_STATUS_CODE = 403;
export const HTTP_UNAUTHORIZED_STATUS_CODE = 401;

export const API_CLIENT_MAX_REQUEST_RETRIES = 3;
