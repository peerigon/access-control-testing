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
