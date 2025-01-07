export type AuthenticationCredentials = {
  identifier: string;
  password: string;
};

// todo: add classic cookie-based session
export type Session = BearerAuthSession;

export type BearerAuthSession = {
  bearerToken: string;
  expiresAt?: Date;
};

export type AuthParameterLocationDescription = {
  parameterName?: string;
  parameterLocation?: string; // narrow down to query, header, cookie, path, or body
};
