import { Resource } from "./entities/resource.ts";
import { PolicyDecisionPoint } from "./policy-decision-point.ts";
import { Privilege } from "./privilege.ts";
import { RelationshipPrivileges } from "./relationship-privileges.ts";
import { Relationship } from "./relationship.ts";
import type {
  Action,
  ResourceDescription,
  ResourceIdentifier,
  ResourceName,
} from "./types.ts";

export class RelationshipManager {
  private readonly relatedResources = new Map<
    ResourceDescription,
    Array<Relationship>
  >();

  /**
   * Derives the privileges for a given resourceDescription from the
   * relationships
   */
  // todo: change naming from resource to entity?
  getResourcePrivileges(
    resourceDescription: ResourceDescription,
  ): Array<Privilege> | null {
    const relationships = this.relatedResources.get(resourceDescription);

    if (!relationships) {
      return null;
    }

    const privileges = this.getPrivilegesFromRelationships(relationships);

    // todo: maybe wrap around set? -> remove duplicates
    // -> Set could also be returned instead of converting back to array?

    return privileges;
  }

  /**
   * Lists all resources including the way the user can access them. For
   * concrete resources, the resourceIdentifier is also included.
   */
  listResourceAccesses(): Array<{
    resourceName: ResourceName;
    resourceIdentifier?: ResourceIdentifier;
    resourceAccess: Action; // todo: unify naming access/action
  }> {
    return [...this.relatedResources].flatMap(
      ([resourceDescription, relationships]) => {
        const [resourceName, resourceIdentifier] =
          resourceDescription.split(":");

        // each privilege corresponds to an access type
        const privileges = this.getPrivilegesFromRelationships(relationships);

        // todo: don't inherit create specific privilege from owning a specific resource
        // only create if it is explicitly set
        /* const createExplicitlySet = relationships.includes(
          Relationship.CREATOR,
        );
        if (
          resourceIdentifier &&
          privileges.includes(Privilege.CREATE) &&
          !createExplicitlySet
        ) {
          privileges = privileges.filter(
            (privilege) => privilege !== Privilege.CREATE,
          );
        } */

        return privileges.map((privilege) => ({
          resourceName,
          resourceIdentifier,
          resourceAccess:
            PolicyDecisionPoint.convertPrivilegeToAction(privilege),
        }));
      },
    );
  }

  private getPrivilegesFromRelationships(relationships: Array<Relationship>) {
    // todo: clarify if there can be duplicates in privileges caused by duplicate relationships?
    const privileges = relationships.flatMap(
      (relationship) => RelationshipPrivileges[relationship],
    );
    return privileges;
  }

  relateTo(
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
   *
   * @param resource
   * @param resourceIdentifier
   */
  owns(resource: Resource, resourceIdentifier?: ResourceIdentifier) {
    this.relateTo(resource, Relationship.OWNERSHIP, resourceIdentifier);
  }

  /**
   * Specifies that the user can create resources of the given type
   *
   * @param resource
   */
  canCreate(resource: Resource) {
    this.relateTo(resource, Relationship.CREATOR);
  }

  /**
   * Specifies that the user can view resources of the given type or, if a
   * resourceIdentifier is provided, a specific instance of the given resource
   *
   * @param resource
   * @param resourceIdentifier Optional resource identifier
   */
  canView(resource: Resource, resourceIdentifier?: ResourceIdentifier) {
    this.relateTo(resource, Relationship.VIEWER, resourceIdentifier);
  }

  /**
   * Specifies that the user can edit resources of the given type or, if a
   * resourceIdentifier is provided, a specific instance of the given resource
   *
   * @param resource
   * @param resourceIdentifier Optional resource identifier
   */
  canEdit(resource: Resource, resourceIdentifier?: ResourceIdentifier) {
    this.relateTo(resource, Relationship.EDITOR, resourceIdentifier);
  }

  /**
   * Specifies that the user can delete resources of the given type or, if a
   * resourceIdentifier is provided, a specific instance of the given resource
   *
   * @param resource
   * @param resourceIdentifier Optional resource identifier
   */
  canDelete(resource: Resource, resourceIdentifier?: ResourceIdentifier) {
    this.relateTo(resource, Relationship.DELETER, resourceIdentifier);
  }
}
