import { Resource } from "./resource";

export class User {
  // todo: this needs to include specific resource metadata to identify a specific resource
  private readonly _relatedResources: Map<Resource, RelationshipType> =
    new Map();
  constructor(
    private readonly _identifier: string,
    private readonly _password: string,
  ) {}

  public get identifier() {
    return this._identifier;
  }

  public get password() {
    return this._password;
  }

  // methode relateTo(resource: Resource, relationshipType: RelationshipType): void {
  public relateTo(resource: Resource, relationshipType: RelationshipType) {
    // todo: clarify what should happen when a resource is related multiple times
    // combine all the relationshipTypes to a privilege map
    // or throw an error in this case?

    this._relatedResources.set(resource, relationshipType);
  }

  public owns(resource: Resource) {
    this.relateTo(resource, RelationshipType.OWNERSHIP);
  }

  public canView(resource: Resource) {
    this.relateTo(resource, RelationshipType.VIEWER);
  }

  public canEdit(resource: Resource) {
    this.relateTo(resource, RelationshipType.EDITOR);
  }

  public canCreate(resource: Resource) {
    this.relateTo(resource, RelationshipType.CREATOR);
  }
}
