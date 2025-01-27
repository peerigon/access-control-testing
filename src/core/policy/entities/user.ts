import { AuthenticationCredentials } from "../../authentication/http/types.ts";
import { Privilege } from "../privilege.ts";
import { RelationshipPrivileges } from "../relationship-privileges.ts";
import { Relationship } from "../relationship.ts";
import { ResourceDescription, ResourceIdentifier } from "../types.ts";
import { Resource } from "./resource.ts";

export class User {
  // todo: this needs to include specific resource metadata to identify a specific resource
  private readonly relatedResources: Map<ResourceDescription, Relationship[]> =
    new Map();
  // from this, privileges for a resourceDescription can be derived

  /**
   * Derives the privileges for a given resourceDescription from the relationships
   */
  public getResourcePrivileges(
    resourceDescription: ResourceDescription,
  ): Privilege[] | null {
    const relationships = this.relatedResources.get(resourceDescription);

    if (!relationships) {
      return null;
    }

    const privileges = relationships.flatMap(
      (relationship) => RelationshipPrivileges[relationship],
    );

    // todo: maybe wrap around set? -> remove duplicates
    // -> Set could also be returned instead of converting back to array?

    console.log(privileges);

    return privileges;
  }

  constructor(
    private readonly identifier: string,
    private readonly password: string,
  ) {}

  public toString(): String {
    return this.identifier;
  }

  public getCredentials(): AuthenticationCredentials {
    return {
      identifier: this.identifier,
      password: this.password,
    };
  }

  public relateTo(
    resource: Resource,
    relationship: Relationship,
    resourceIdentifier?: ResourceIdentifier,
  ) {
    // todo: clarify what should happen when a resource is related multiple times
    // combine all the relationshipTypes to a privilege map
    // or throw an error in this case?

    // -> when relating, we extract the privileges from the given relationship
    // all privileges, that were not present are added, none are removed
    // example: owns(), canCreate() -> all privileges
    // example: canCreate(), owns() -> all privileges
    // example: canEdit(), canView() -> view, edit (canView() does not remove edit perm from first call)

    const resourceDescription = User.getResourceDescription(
      resource,
      resourceIdentifier,
    );

    const existingRelationships =
      this.relatedResources.get(resourceDescription);

    if (existingRelationships) {
      existingRelationships.push(relationship);
      this.relatedResources.set(resourceDescription, existingRelationships);
    } else {
      this.relatedResources.set(resourceDescription, [relationship]);
    }
  }

  // todo: move out of here
  /**
   * Derives a resource description from a resource and an optional resource identifier
   * Example: "todo:123" or "todo"
   * @param resource
   * @param resourceIdentifier
   */
  public static getResourceDescription(
    resource: Resource,
    resourceIdentifier?: ResourceIdentifier,
  ) {
    const resourceName = resource.getName();
    if (resourceIdentifier === undefined || resourceIdentifier === null) {
      return resourceName; // todo: is there another convention on how to specify a resource without a concrete instance?
    }

    return `${resourceName}:${resourceIdentifier}`;
  }

  // todo: add specific typing for resourceIdentifier based on user preference
  // OR: always use string, convert number or other identifiers to string automatically?
  public owns(resource: Resource, resourceIdentifier: ResourceIdentifier) {
    this.relateTo(resource, Relationship.OWNERSHIP, resourceIdentifier);
  }

  public canCreate(resource: Resource) {
    this.relateTo(resource, Relationship.CREATOR);
  }

  public canView(resource: Resource, resourceIdentifier: ResourceIdentifier) {
    this.relateTo(resource, Relationship.VIEWER, resourceIdentifier);
  }

  public canEdit(resource: Resource, resourceIdentifier: ResourceIdentifier) {
    this.relateTo(resource, Relationship.EDITOR, resourceIdentifier);
  }

  public canDelete(resource: Resource, resourceIdentifier: ResourceIdentifier) {
    this.relateTo(resource, Relationship.DELETER, resourceIdentifier);
  }
}
