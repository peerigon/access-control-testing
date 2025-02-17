export const TOOL_NAME = "act";
export const OPENAPI_FIELD_PREFIX = `x-${TOOL_NAME}`;
export const OpenApiFieldNames: Record<string, string> = {
  RESOURCE_NAME: "resource-name",
  RESOURCE_ACCESS: "resource-access",
  AUTH_ENDPOINT: "auth-endpoint",
  AUTH_FIELD: "auth-field",
};

export const HTTP_FORBIDDEN_STATUS_CODE = 403;
export const HTTP_UNAUTHORIZED_STATUS_CODE = 401;

// todo: use this
export const API_CLIENT_MAX_REQUEST_RETRIES = 3;
