import { ResourceIdentifier } from "../types.js";

export class Resource {
  // todo: make sure name is unique?
  // todo: also validate that it can't contain a : character since it is used as a separator
  constructor(private readonly name: string) {}

  public getName() {
    return this.name;
  }

  /**
   * Derives a resource description from a resource and an optional resource identifier
   * Example: "todo:123" or "todo"
   * @param resource
   * @param resourceIdentifier
   */
  public static getResourceDescription(
    resource: Resource,
    resourceIdentifier?: ResourceIdentifier,
  ) {
    const resourceName = resource.getName();
    if (resourceIdentifier === undefined || resourceIdentifier === null) {
      return resourceName; // todo: is there another convention on how to specify a resource without a concrete instance?
    }

    return `${resourceName}:${resourceIdentifier}`;
  }
}
