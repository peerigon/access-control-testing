export class User {
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
  // methode owns(resource: Resource): return relateTo(resource, RelationshipType.OWNERSHIP);
}
