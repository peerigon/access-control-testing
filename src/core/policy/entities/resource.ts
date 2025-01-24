export class Resource {
  // todo: make sure name is unique?
  constructor(private readonly name: string) {}

  public getName() {
    return this.name;
  }
}
