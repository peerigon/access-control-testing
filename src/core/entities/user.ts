export class User {
  constructor(
    private readonly identifier: string,
    private readonly password: string,
  ) {}

  // methode relateTo(resource: Resource, relationshipType: RelationshipType): void {
  // methode owns(resource: Resource): return relateTo(resource, RelationshipType.OWNERSHIP);
}
