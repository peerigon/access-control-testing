import { Resource } from "./entities/resource.ts";
import { User } from "./entities/user.ts";
import { Privilege } from "./privilege.ts";
import { type Action, type ResourceIdentifier } from "./types.ts";

export const PolicyDecisionPoint = {
  // todo: some resources could be public for all (-> make that configurable)
  /**
   * Decides if a user is permitted to perform an action on a resource based on
   * the user's privileges that are derived from the user's relationships to
   * resources.
   *
   * @param user The user that wants to perform the action
   * @param action The action the user wants to perform
   * @param resource The resource object describing the resource the user wants
   *   to perform the action on
   * @param resourceIdentifier The identifier of the specific resource the user
   *   wants to perform the action on
   * @returns True if the user is permitted to perform the action on the
   *   resource, false otherwise
   */
  isAllowed(
    user: User,
    action: Action,
    resource: Resource,
    resourceIdentifier?: ResourceIdentifier,
  ): boolean {
    const requiredPrivilege = this.convertActionToPrivilege(action);

    // todo: refactor
    const resourceDescription = Resource.getResourceDescription(
      resource,
      resourceIdentifier,
    );

    const userHasPrivilegeExplicitly = user
      .getResourcePrivileges(resourceDescription)
      ?.some((privilege) => privilege === requiredPrivilege);

    const userInheritedPrivilege = user
      .getResourcePrivileges(Resource.getResourceDescription(resource))
      ?.some((privilege) => privilege === requiredPrivilege);

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return Boolean(userHasPrivilegeExplicitly || userInheritedPrivilege);
  },

  // todo: rename action to accessType?
  convertActionToPrivilege: (action: Action): Privilege => {
    switch (action) {
      case "create": {
        return Privilege.CREATE;
      }
      case "read": {
        return Privilege.READ;
      }
      case "update": {
        return Privilege.UPDATE;
      }
      case "delete": {
        return Privilege.DELETE;
      }
    }
  },

  // todo: move somewhere else
  convertPrivilegeToAction: (privilege: Privilege): Action => {
    switch (privilege) {
      case Privilege.CREATE: {
        return "create";
      }
      case Privilege.READ: {
        return "read";
      }
      case Privilege.UPDATE: {
        return "update";
      }
      case Privilege.DELETE: {
        return "delete";
      }
    }
  },
};
