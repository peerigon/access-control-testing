// in the format <namespace>:<object_id>
// not in class format, since in map equality wouldn't be given when trying to find a resource instance
export type ResourceDescription = string;
export type ResourceIdentifier = string | number;

// todo: make enum out of union type?
export type Action = "create" | "read" | "update" | "delete";
