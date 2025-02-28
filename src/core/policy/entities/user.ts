import { AuthenticationCredentials } from "../../authentication/http/types.ts";
import { RelationshipManager } from "../relationship-manager.ts";

export class User extends RelationshipManager {
  private static readonly userIdentifiers = new Set<string>();
  constructor(
    private readonly identifier: string,
    private readonly password: string,
  ) {
    const identifierAlreadyAdded = User.userIdentifiers.has(identifier);

    if (identifierAlreadyAdded) {
      throw new Error(
        `User with identifier '${identifier}' can't be defined twice as it has already been defined before.`,
      );
    }

    User.userIdentifiers.add(identifier);

    super();
  }

  toString(): string {
    return this.identifier;
  }

  getCredentials(): AuthenticationCredentials {
    return {
      identifier: this.identifier,
      password: this.password,
    };
  }
}
