// todo: implement this & move function outside
// for now just dummy implementation
import { OpenAPIParser } from "../parsers/openapi-parser.ts";
import { Resource } from "../policy/entities/resource.ts";
import { User } from "../policy/entities/user.ts";
import { PolicyDecisionPoint } from "../policy/policy-decision-point.ts";
import { Action, ResourceIdentifier } from "../policy/types.ts";
import { Route } from "../types.ts";

export type TestDataset = Array<{
  user: User | null; // alternatively: AnonymousUser (extends User)
  route: Route;
  expectedRequestToBeAllowed: boolean;
}>;

// mock users and resources for now
// todo: this should come from Act instance which the tool user configured
const user1 = new User("niklas.haug@tha.de", "niklas.haug@tha.de");

const userResource = new Resource("User"); // must be resourcename from openapi
user1.canView(userResource); // can view all Users -> /admin/users & /admin/users/:id
console.log(
  "user1canview",
  PolicyDecisionPoint.isAllowed(user1, "read", userResource, 1), // todo: read vs. view?
);
// todo: unit test for scenarios:
// canView(userResource):
//    isAllowed(user1, "read", userResource, 1) -> true && isAllowed(user1, "read", userResource) -> true
// canView(userResource, 1):
//    isAllowed(user1, "read", userResource, 1) -> true && isAllowed(user1, "read", userResource) -> false

const anotherResource = new Resource("Test"); // must be resourcename from openapi

export class TestcaseGenerator {
  constructor(private readonly openApiParser: OpenAPIParser) {}

  // todo: this shouldn't be async, solve async in source (OpenAPI parser)
  public generateTestDataset(): TestDataset {
    // todo: generate full-formed URLs with parameters
    // todo: for now only query parameters and path parameters are supported, maybe add support for other types of parameters
    // resource params mapping
    const pathResourceMappings = this.openApiParser.getPathResourceMappings();

    // each url resource mapping has "<Access> <Resource>" pairs with info where to find resource param
    const resourceUserCombinations = this.generateResourceUserCombinations();

    // instead of for each -> map
    return pathResourceMappings.flatMap((pathResourceMapping) => {
      // todo: create Route object for url & method to use instead
      const { path, method, isPublicPath, resources } = pathResourceMapping;

      const routeHasResources =
        Array.isArray(resources) && resources.length > 0;

      // no resources available -> default: deny (except for "public" routes)
      // todo: mark routes as public (for anonymous users) or available for all logged-in users
      // routes that are public for anonymous users are expected to be allowed for logged-in users too

      if (!routeHasResources) {
        if (isPublicPath) {
          // todo: if that's the case, no need to test, right?
          // the only thing that COULD be tested is if legitimate users are not blocked
          // since it's public anyway, there can be no escalation of privileges, skip for now
          return [];
        }

        // in case it's non-public/only available for any authenticated user:
        // test from anonymous user perspective
        return {
          user: null,
          route: {
            url: this.openApiParser.constructFullApiUrl(path),
            method,
          },
          expectedRequestToBeAllowed: false,
        };
      }

      // todo: handle multiple resources: foreach resource in resources
      const currentResource = resources[0];

      // only use resourceUserCombinations that match with the given resource and access type

      // resource (from resources inside of pathResourceMapping) is a Resource object mapped to the iterated url

      // each resource has a resourceName as string to map to a Resource instance
      // it also has a resourceAccess type as string to map to an Action
      // also, a parameterName as string and a parameterLocation as string to be able to expand the url

      // only consume resourceUserCombinations that match the current resource and access type
      // todo: should the consumed resourceUserCombinations be removed from the list?
      const matchingResourceUserCombinations = resourceUserCombinations.filter(
        (combination) =>
          combination.resource.getName() === currentResource.resourceName &&
          combination.resourceAction === currentResource.resourceAccess, // todo: unify naming of resourceAccess and resourceAction
      );
      return matchingResourceUserCombinations.flatMap((combination) => {
        const { user, resource, resourceAction, resourceId } = combination;
        const expectedRequestToBeAllowed = PolicyDecisionPoint.isAllowed(
          user,
          resourceAction,
          resource,
          resourceId,
        );

        // if resource id is needed in url but not provided in combination.resourceId, skip current combination
        if (
          OpenAPIParser.pathContainsParameter(
            path,
            currentResource.parameterName,
          ) &&
          resourceId == undefined
        ) {
          return [];
        }

        // todo: currently only parameterLocation path supported
        // function should support parameterLocation, parameterName and parameterValue

        // resourceId can be undefined when resource access is create for instance
        // or when access for all resources of a type is described
        const expandedPath =
          resourceId == undefined
            ? path
            : OpenAPIParser.expandUrlTemplate(path, {
                [currentResource.parameterName]: resourceId,
              }); // todo: for multiple resources and therefore parameters, multiple keys in object -> dynamic mapping required

        const url = this.openApiParser.constructFullApiUrl(expandedPath);

        return {
          user,
          route: {
            url,
            method,
          },
          expectedRequestToBeAllowed,
        };
      });
    });
  }

  private generateResourceUserCombinations() {
    // todo: make this dynamic
    const resourceUserCombinations: Array<{
      user: User;
      resource: Resource;
      resourceAction: Action;
      resourceId?: ResourceIdentifier;
    }> = [
      {
        user: user1,
        resource: userResource,
        resourceAction: "read", // einzige zu mappende Request -> GET /admin/users
      },
      {
        user: user1,
        resource: userResource,
        resourceAction: "read",
        resourceId: 1,
      },
      {
        user: user1,
        resource: userResource,
        resourceAction: "update",
        resourceId: 1,
      },
      {
        user: user1,
        resource: anotherResource,
        resourceAction: "update",
        resourceId: 1,
      },
    ];

    return resourceUserCombinations;
  }

  private getAllUsers(): Array<User> {
    // todo: gather all users from act.scan() setup

    return [user1];
  }
}
