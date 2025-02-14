import { AuthenticationCredentials } from "../../authentication/http/types.ts";
import { RelationshipManager } from "../relationship-manager.js";
import { Resource } from "./resource.js";

export class User extends RelationshipManager<Resource> {
  constructor(
    private readonly identifier: string,
    private readonly password: string,
  ) {
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
