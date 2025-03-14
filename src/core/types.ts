import type { AuthParameterLocationDescription } from "./authentication/http/types.ts";
import type { OpenAPIParser } from "./parsers/openapi-parser.ts";

export type AuthEndpointInformation = {
  authEndpoint: ReturnType<OpenAPIParser["getOperations"]>[0];
  authRequestParameterDescription: {
    identifier: AuthParameterLocationDescription;
    password: AuthParameterLocationDescription;
  };
  authResponseParameterDescription: AuthParameterLocationDescription;
};
