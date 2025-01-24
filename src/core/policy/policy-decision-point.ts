import { Resource } from "./entities/resource";
import { User } from "./entities/user";
import { Privilege } from "./privilege";
import { Action, ResourceIdentifier } from "./types";

export class PolicyDecisionPoint {
  // todo: rename resource with ResourceType, since its not a concrete instance of a Resource?
  public static isAllowed(
    user: User,
    action: Action,
    resource: Resource,
    resourceIdentifier?: ResourceIdentifier,
  ): boolean {
    const resourceDescription = User.getResourceDescription(
      resource,
      resourceIdentifier,
    );
    const requiredPrivilege = this.convertActionToPrivilege(action);

    const userPrivileges = user.getResourcePrivileges(resourceDescription);

    if (!userPrivileges) {
      return false;
    }

    const userHasPrivilege = userPrivileges.some(
      (privilege) => privilege === requiredPrivilege,
    );

    return userHasPrivilege;
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
