import { Privilege } from "./privilege.ts";
import { Relationship } from "./relationship.ts";

export const RelationshipPrivileges: Record<Relationship, Array<Privilege>> = {
  [Relationship.OWNERSHIP]: [
    Privilege.CREATE,
    Privilege.READ,
    Privilege.UPDATE,
    Privilege.DELETE,
  ],
  // editor always includes read access
  // todo: clarify, are there cases where editor should not include read access?
  [Relationship.EDITOR]: [Privilege.READ, Privilege.UPDATE],
  [Relationship.VIEWER]: [Privilege.READ],
  [Relationship.CREATOR]: [Privilege.CREATE],
  [Relationship.DELETER]: [Privilege.DELETE],
};
