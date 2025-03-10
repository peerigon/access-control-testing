import type { AuthParameterLocationDescription } from "./authentication/http/types.ts";
import type { OpenAPIParser } from "./parsers/openapi-parser.ts";

export type AuthEndpointInformation = {
  authEndpoint: ReturnType<OpenAPIParser["getPaths"]>[0];
  authRequestParameterDescription: {
    username: AuthParameterLocationDescription;
    password: AuthParameterLocationDescription;
  };
  authResponseParameterDescription: AuthParameterLocationDescription;
};
