import { Resource } from "./entities/resource.ts";
import { User } from "./entities/user.ts";
import { Privilege } from "./privilege.ts";
import { Action, ResourceIdentifier } from "./types.ts";

export class PolicyDecisionPoint {
  // todo: rename resource with ResourceType, since its not a concrete instance of a Resource?
  // some resources could be public for all (-> make that configurable)
  /**
   * Decides if a user is allowed to perform an action on a resource based on the user's privileges that are derived from the user's relationships to resources.
   * @param user The user that wants to perform the action
   * @param action The action the user wants to perform
   * @param resource The resource object describing the resource the user wants to perform the action on
   * @param resourceIdentifier The identifier of the specific resource the user wants to perform the action on
   * @returns true if the user is allowed to perform the action on the resource, false otherwise
   */
  public static isAllowed(
    user: User,
    action: Action,
    resource: Resource,
    resourceIdentifier?: ResourceIdentifier,
  ): boolean {
    const requiredPrivilege = this.convertActionToPrivilege(action);

    // todo: refactor
    const resourceDescription = User.getResourceDescription(
      resource,
      resourceIdentifier,
    );

    const userHasPrivilegeExplicitly = user
      .getResourcePrivileges(resourceDescription)
      ?.some((privilege) => privilege === requiredPrivilege);

    const userInheritedPrivilege = user
      .getResourcePrivileges(User.getResourceDescription(resource))
      ?.some((privilege) => privilege === requiredPrivilege);

    return Boolean(userHasPrivilegeExplicitly || userInheritedPrivilege);
  }

  private static convertActionToPrivilege(action: Action): Privilege {
    switch (action) {
      case "create":
        return Privilege.CREATE;
      case "read":
        return Privilege.READ;
      case "update":
        return Privilege.UPDATE;
      case "delete":
        return Privilege.DELETE;
    }
  }
}
