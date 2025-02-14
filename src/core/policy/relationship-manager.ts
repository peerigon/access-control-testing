import { Resource } from "./entities/resource.ts";
import { Privilege } from "./privilege.ts";
import { RelationshipPrivileges } from "./relationship-privileges.ts";
import { Relationship } from "./relationship.ts";
import { ResourceDescription, ResourceIdentifier } from "./types.ts";

export class RelationshipManager {
  private readonly relatedResources: Map<ResourceDescription, Relationship[]> =
    new Map();

  /**
   * Derives the privileges for a given resourceDescription from the relationships
   */
  // todo: change naming from resource to entity?
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

    return privileges;
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

    const resourceDescription = Resource.getResourceDescription(
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

  // todo: add specific typing for resourceIdentifier based on user preference
  // OR: always use string, convert number or other identifiers to string automatically?
  /**
   * Specifies that the user owns a specific instance of the given resource
   * @param resource
   * @param resourceIdentifier
   */
  public owns(resource: Resource, resourceIdentifier: ResourceIdentifier) {
    this.relateTo(resource, Relationship.OWNERSHIP, resourceIdentifier);
  }

  /**
   * Specifies that the user can create resources of the given type
   * @param resource
   */
  public canCreate(resource: Resource) {
    this.relateTo(resource, Relationship.CREATOR);
  }

  /**
   * Specifies that the user can view resources of the given type or, if a resourceIdentifier is provided, a specific instance of the given resource
   * @param resource
   * @param resourceIdentifier Optional resource identifier
   */
  public canView(resource: Resource, resourceIdentifier?: ResourceIdentifier) {
    this.relateTo(resource, Relationship.VIEWER, resourceIdentifier);
  }

  /**
   * Specifies that the user can edit resources of the given type or, if a resourceIdentifier is provided, a specific instance of the given resource
   * @param resource
   * @param resourceIdentifier Optional resource identifier
   */
  public canEdit(resource: Resource, resourceIdentifier?: ResourceIdentifier) {
    this.relateTo(resource, Relationship.EDITOR, resourceIdentifier);
  }

  /**
   * Specifies that the user can delete resources of the given type or, if a resourceIdentifier is provided, a specific instance of the given resource
   * @param resource
   * @param resourceIdentifier Optional resource identifier
   */
  public canDelete(
    resource: Resource,
    resourceIdentifier?: ResourceIdentifier,
  ) {
    this.relateTo(resource, Relationship.DELETER, resourceIdentifier);
  }
}
