export enum RelationshipType {
  OWNERSHIP = "OWNERSHIP",
  EDITOR = "EDITOR",
  VIEWER = "VIEWER",
  CREATOR = "CREATOR",
}

// create is stateless, not bound to one specific resource
// also: how to handle "bulk actions" -> view all, edit all, delete all etc.
export enum Privilege {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}
