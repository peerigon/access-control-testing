import { AuthenticationCredentials } from "../../authentication/http/types.ts";
import { RelationshipManager } from "../relationship-manager.ts";

export class User extends RelationshipManager {
  private static readonly userIdentifiers: Set<string> = new Set();
  constructor(
    private readonly identifier: string,
    private readonly password: string,
  ) {
    const identifierAlreadyAdded = User.userIdentifiers.has(identifier);

    // todo: unit test
    if (identifierAlreadyAdded) {
      throw new Error(
        `User with identifier '${identifier}' can't be defined twice as it has already been defined before.`,
      );
    }

    User.userIdentifiers.add(identifier);

    super();
  }

  public toString(): String {
    return this.identifier;
  }

  public getCredentials(): AuthenticationCredentials {
    return {
      identifier: this.identifier,
      password: this.password,
    };
  }
}
