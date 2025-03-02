export const TOOL_NAME = "act";
export const OPENAPI_FIELD_PREFIX = `x-${TOOL_NAME}`;

type OpenApiFieldKeys =
  | "RESOURCE_NAME"
  | "RESOURCE_ACCESS"
  | "AUTH_ENDPOINT"
  | "AUTH_FIELD";

export const OpenApiFieldNames: Record<OpenApiFieldKeys, string> = {
  RESOURCE_NAME: "resource-name",
  RESOURCE_ACCESS: "resource-access",
  AUTH_ENDPOINT: "auth-endpoint",
  AUTH_FIELD: "auth-field",
};

export const HTTP_FORBIDDEN_STATUS_CODE = 403;
export const HTTP_UNAUTHORIZED_STATUS_CODE = 401;

export const API_CLIENT_MAX_REQUEST_RETRIES = 2;
