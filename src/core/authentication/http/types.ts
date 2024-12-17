export type AuthenticationCredentials = {
  identifier: string;
  password: string;
};

export type Session = {
  token: string;
  expiresAt?: Date;
};
// todo: evtl. BasicAuthSession | BearerAuthSession
