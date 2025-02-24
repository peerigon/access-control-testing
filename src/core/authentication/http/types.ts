import type { Options } from "got";
import { CookieJar } from "tough-cookie";

export type AuthenticationCredentials = {
  identifier: string;
  password: string;
};

export type Session = BearerAuthSession | CookieAuthSession;

export type BearerAuthSession = {
  bearerToken: string;
  expiresAt?: Date;
};

export type CookieAuthSession = {
  cookies: CookieJar;
  expiresAt?: Date;
};

export type ParameterLocation = "query" | "header" | "cookie" | "path" | "body";

export type AuthParameterLocationDescription = {
  parameterName: string;
  // todo: verify if all locations are valid; make enum out of it?
  parameterLocation: ParameterLocation;
};

export enum AuthenticatorType {
  HTTP_BEARER = "httpBearer",
  HTTP_BASIC = "httpBasic",
  API_KEY_COOKIE = "apiKeyCookie",
  NONE = "none",
}

export type RequestOptions = Options;
