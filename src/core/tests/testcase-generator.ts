import ObjectSet from "object-set-type";
import { OpenAPIParser } from "../parsers/openapi-parser.ts";
import { Resource } from "../policy/entities/resource.ts";
import { User } from "../policy/entities/user.ts";
import { PolicyDecisionPoint } from "../policy/policy-decision-point.ts";
import { Action, ResourceIdentifier, ResourceName } from "../policy/types.ts";
import { removeObjectDuplicatesFromArray } from "../utils.ts";
import { Route } from "./test-utils.ts";

export type TestCase = {
  user: User | null; // alternatively: AnonymousUser (extends User)
  route: Route;
  expectedRequestToBeAllowed: boolean;
};
export type TestCases = Array<TestCase>;

/*
user1.canView(userResource); // can view all Users -> /admin/users & /admin/users/:id
console.log(
  "user1canview",
  PolicyDecisionPoint.isAllowed(user1, "read", userResource, 1), // todo: read vs. view?
);*/
// todo: unit test for scenarios:
// canView(userResource):
//    isAllowed(user1, "read", userResource, 1) -> true && isAllowed(user1, "read", userResource) -> true
// canView(userResource, 1):
//    isAllowed(user1, "read", userResource, 1) -> true && isAllowed(user1, "read", userResource) -> false

export class TestcaseGenerator {
  constructor(
    private readonly openApiParser: OpenAPIParser,
    private readonly users: Array<User>,
  ) {}

  // todo: this shouldn't be async, solve async in source (OpenAPI parser)
  generateTestCases(): TestCases {
    // todo: generate full-formed URLs with parameters
    // todo: for now only query parameters and path parameters are supported, maybe add support for other types of parameters
    // resource params mapping
    const pathResourceMappings = this.openApiParser.getPathResourceMappings();

    // each url resource mapping has "<Access> <Resource>" pairs with info where to find resource param
    const resourceUserCombinations = this.generateResourceUserCombinations();

    const testcases: TestCases = pathResourceMappings.flatMap<TestCase>(
      (pathResourceMapping) => {
        // todo: create Route object for url & method to use instead
        const { path, method, isPublicPath, resources } = pathResourceMapping;

        // todo: handle multiple resources: foreach resource in resources
        const currentResource = resources[0];

        if (resources.length > 1) {
          console.warn(
            "Multiple resources in a single route are not supported yet. Only the first resource will be used.",
          );
        }

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
            route: new Route(
              this.openApiParser.constructFullApiUrl(path),
              method,
            ),
            expectedRequestToBeAllowed: false,
          };
        }

        // only use resourceUserCombinations that match with the given resource and access type

        // resource (from resources inside of pathResourceMapping) is a Resource object mapped to the iterated url

        // each resource has a resourceName as string to map to a Resource instance
        // it also has a resourceAccess type as string to map to an Action
        // also, a parameterName as string and a parameterLocation as string to be able to expand the url

        // only consume resourceUserCombinations that match the current resource and access type
        // todo: should the consumed resourceUserCombinations be removed from the list?
        const matchingResourceUserCombinations =
          resourceUserCombinations.filter(
            (combination) =>
              combination.resourceName === currentResource.resourceName &&
              combination.resourceAction === currentResource.resourceAccess &&
              combination.resourceIdentifier !== undefined, // only consume combinations with a concrete resourceIdentifier
            // todo: validate that this restriction is wanted
          );

        return matchingResourceUserCombinations.flatMap((combination) => {
          const { user, resourceName, resourceAction, resourceIdentifier } =
            combination;
          const resource = new Resource(resourceName);

          const resourceIdentifierRequiredButNotProvided =
            currentResource.parameterName != undefined &&
            OpenAPIParser.pathContainsParameter(
              path,
              currentResource.parameterName,
            ) &&
            resourceIdentifier == undefined;

          if (resourceIdentifierRequiredButNotProvided) {
            return [];
          }

          // todo: currently only parameterLocation path supported
          // function should support parameterLocation, parameterName and parameterValue

          // resourceIdentifier can be undefined when resource access is create for instance
          // or when access for all resources of a type is described
          const expandedPath =
            resourceIdentifier == undefined ||
            currentResource.parameterName === undefined ||
            currentResource.parameterLocation === undefined
              ? path
              : OpenAPIParser.expandUrlTemplate(path, {
                  [currentResource.parameterName]: resourceIdentifier,
                }); // todo: for multiple resources and therefore parameters, multiple keys in object -> dynamic mapping required

          const url = this.openApiParser.constructFullApiUrl(expandedPath);

          const expectedRequestToBeAllowed = PolicyDecisionPoint.isAllowed(
            user,
            resourceAction,
            resource,
            resourceIdentifier,
          );

          return {
            user,
            route: new Route(url, method),
            expectedRequestToBeAllowed,
          };
        });
      },
    );

    return removeObjectDuplicatesFromArray(testcases);
  }

  private generateResourceUserCombinations() {
    const resourceUserCombinations = new ObjectSet<{
      user: User;
      resourceName: ResourceName;
      resourceAction: Action;
      resourceIdentifier?: ResourceIdentifier;
    }>();

    // generate combinations between users, actions, resources and resource ids
    // for that, go through relations of each user with a resource,
    // create a test case with expected result of true (for current user) and false (for other users)
    for (const user of this.users) {
      // knowledge of defined relationships
      const resourceAccesses = user.listResourceAccesses();

      for (const resourceAccess of resourceAccesses) {
        const {
          resourceName,
          resourceIdentifier,
          resourceAccess: resourceAction,
        } = resourceAccess;

        // todo: muss hier überhaupt die Vorauswahl der Ressourcen/Access-Kombinationen erfolgen?
        // Mapping von Ressourcen auf passende Routen erfolgt später ja sowieso, nur mappbare Routen werden getestet

        // positive test case (current user) including potentially negative test cases from the perspective of other users
        // todo: strategy for choosing only some users, not all to reduce test cases
        for (const user of this.users) {
          resourceUserCombinations.add({
            user,
            resourceName,
            resourceAction,
            resourceIdentifier,
          });
        }
      }

      // todo: knowledge of resources based on openapi definitions
      // this is only applicable for non-parameterized resources (e.g. GET /users) because no valid resourceIdentifiers are available
      // there will be no guessing of valid resourceIdentifiers in that case
      // adds additional test cases only when resource/access combination is not already covered by someone who is allowed to access it
    }

    return [...resourceUserCombinations];
  }
}
