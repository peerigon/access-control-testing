export type AuthenticationCredentials = {
  identifier: string;
  password: string;
};

export type Session = BearerAuthSession | BasicAuthSession;

export type BearerAuthSession = {
  bearerToken: string;
  expiresAt?: Date;
};

export type BasicAuthSession = {
  authorizationPayload: string;
};
