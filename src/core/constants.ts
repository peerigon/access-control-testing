export const TOOL_NAME = "act";

const OPENAPI_FIELD_PREFIX = `x-${TOOL_NAME}-`;
const OpenApiFieldNames: Record<string, string> = {
  RESOURCE_NAME: "resource-name",
  AUTH_ENDPOINT: "auth-endpoint",
};

// todo: make fields visible for auto-completion, e.g. add extra type information
export const OpenApiFields = new Proxy(OpenApiFieldNames, {
  get(target, prop) {
    if (prop in target && typeof prop === "string") {
      const fieldName = target[prop];
      return OPENAPI_FIELD_PREFIX + fieldName;
    }
    return null;
  },
});
