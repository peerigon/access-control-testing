export type AuthenticationCredentials = {
  identifier: string;
  password: string;
};

// todo: add classic cookie-based session
export type Session = BearerAuthSession | CookieAuthSession;

export type BearerAuthSession = {
  bearerToken: string;
  expiresAt?: Date;
};

export type CookieAuthSession = {
  cookies: Array<{
    name: string;
    value: string;
  }>;
  expiresAt?: Date;
};

export type AuthParameterLocationDescription = {
  parameterName?: string;
  // todo: verify if all locations are valid; make enum out of it?
  parameterLocation?: "query" | "header" | "cookie" | "path" | "body";
};

export enum AuthenticatorType {
  HTTP_BEARER = "httpBearer",
  HTTP_BASIC = "httpBasic",
  API_KEY_COOKIE = "apiKeyCookie",
  NONE = "none",
}
