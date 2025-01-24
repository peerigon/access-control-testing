import { AuthenticationCredentials } from "../../authentication/http/types";
import { Relationship } from "../relationship";
import { RelationshipPrivileges } from "../relationship-privileges";
import { Resource } from "./resource";

export class User {
  // todo: this needs to include specific resource metadata to identify a specific resource
  private readonly _relatedResources: Map<Resource, Relationship> = new Map();
  constructor(
    private readonly _identifier: string,
    private readonly _password: string,
  ) {}

  public get identifier() {
    return this._identifier;
  }

  public toString(): String {
    return this._identifier;
  }

  public get password() {
    return this._password;
  }

  public getCredentials(): AuthenticationCredentials {
    return {
      identifier: this._identifier,
      password: this._password,
    };
  }

  // methode relateTo(resource: Resource, relationshipType: RelationshipType): void {
  public relateTo(resource: Resource, relationship: Relationship) {
    // todo: clarify what should happen when a resource is related multiple times
    // combine all the relationshipTypes to a privilege map
    // or throw an error in this case?

    // -> when relating, we extract the privileges from the given relationship
    // all privileges, that were not present are added, none are removed
    // example: owns(), canCreate() -> all privileges
    // example: canCreate(), owns() -> all privileges
    // example: canEdit(), canView() -> view, edit (canView() does not remove edit perm from first call)

    const privilegesToAdd = RelationshipPrivileges[relationship];

    this._relatedResources.set(resource, relationship);
  }

  // todo: add specific typing for resourceIdentifier based on user preference
  // OR: always use string, convert number or other identifiers to string automatically?
  public owns(resource: Resource, resourceIdentifier: unknown) {
    this.relateTo(resource, Relationship.OWNERSHIP);
  }

  public canCreate(resource: Resource) {
    this.relateTo(resource, Relationship.CREATOR);
  }

  public canView(resource: Resource, resourceIdentifier: unknown) {
    this.relateTo(resource, Relationship.VIEWER);
  }

  public canEdit(resource: Resource, resourceIdentifier: unknown) {
    this.relateTo(resource, Relationship.EDITOR);
  }

  public canDelete(resource: Resource, resourceIdentifier: unknown) {
    this.relateTo(resource, Relationship.DELETER);
  }
}
