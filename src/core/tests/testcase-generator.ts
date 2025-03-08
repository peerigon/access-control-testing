import ObjectSet from "object-set-type";
import {
  HTTP_FORBIDDEN_STATUS_CODE,
  HTTP_UNAUTHORIZED_STATUS_CODE,
} from "../constants.ts";
import { OpenAPIParser } from "../parsers/openapi-parser.ts";
import { Resource } from "../policy/entities/resource.ts";
import { User } from "../policy/entities/user.ts";
import { PolicyDecisionPoint } from "../policy/policy-decision-point.ts";
import type {
  Action,
  ResourceIdentifier,
  ResourceName,
} from "../policy/types.ts";
import { removeObjectDuplicatesFromArray } from "../utils.ts";
import { TestCase } from "./runner/test-runner.ts";
import { performRequest, Route } from "./test-utils.ts";

export type TestCombination = {
  user: User | null;
  route: Route;
  expectedRequestToBeAllowed: boolean;
};

type AccessControlResult = "permitted" | "denied";

type TestResult = {
  user: User | null;
  route: Route;
  expected: AccessControlResult;
  actual?: AccessControlResult;
  testResult?: "✅" | "❌" | "⏭️";
};

export type TestCombinations = Array<TestCombination>;

export class TestcaseGenerator {
  constructor(
    private readonly openApiParser: OpenAPIParser,
    private readonly users: Array<User>,
  ) {}

  generateTestCombinations(): TestCombinations {
    // todo: generate full-formed URLs with parameters
    // todo: for now only query parameters and path parameters are supported, maybe add support for other types of parameters
    // resource params mapping
    const pathResourceMappings = this.openApiParser.getPathResourceMappings();

    // each url resource mapping has "<Access> <Resource>" pairs with info where to find resource param
    const resourceUserCombinations = this.generateResourceUserCombinations();

    const testcases: TestCombinations =
      pathResourceMappings.flatMap<TestCombination>((pathResourceMapping) => {
        // todo: create Route object for url & method to use instead
        const { path, method, isPublicPath, resources } = pathResourceMapping;

        if (resources.length > 1) {
          console.warn(
            "Multiple resources in a single route are not supported yet. Only the first resource will be used.",
          );
        }

        const routeHasResources =
          Array.isArray(resources) && resources.length > 0;

        // no resources available -> default: deny (except for "public" routes)
        // todo: mark routes as public (for anonymous users) or available for all logged-in users
        // routes that are public for anonymous users are expected to be permitted for logged-in users too

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

        // todo: handle multiple resources: foreach resource in resources
        // resource availability was checked before, so there is at least one resource available
        const currentResource = resources[0]!;

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
            currentResource.parameterName !== undefined &&
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
      });

    return removeObjectDuplicatesFromArray(testcases);
  }

  private generateResourceUserCombinations() {
    const resourceUserCombinations = new ObjectSet<{
      user: User;
      resourceName: ResourceName;
      resourceAction: Action;
      resourceIdentifier?: ResourceIdentifier;
    }>();

    // todo: move this explanation to JSDoc
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
      // adds additional test cases only when resource/access combination is not already covered by someone who is permitted to access it
    }

    return [...resourceUserCombinations];
  }

  public async generateTestCases(): Promise<Array<TestCase>> {
    const testCombinations = this.generateTestCombinations();

    const results: Array<TestResult> = [];
    const blockedUserIdentifiers: Array<User["identifier"]> = []; // todo: still working?

    return testCombinations.map((testCombination) => {
      const { user, route, expectedRequestToBeAllowed } = testCombination;

      return {
        name: `${route} from the perspective of user '${user ?? "anonymous"}'`,
        test: async ({ expect, skip }) => {
          const expected: AccessControlResult = expectedRequestToBeAllowed
            ? "permitted"
            : "denied"; // todo: make enum for this?

          const testResult: TestResult = {
            user,
            route,
            expected,
            testResult: "❌",
          };
          results.push(testResult);

          const userHasBeenBlocked =
            user !== null &&
            blockedUserIdentifiers.includes(user.getCredentials().identifier);
          if (userHasBeenBlocked) {
            testResult.testResult = "⏭️";
            skip(
              `User '${user}' has been blocked since a previous attempt to authenticate failed.`,
            );
            return;
          }

          const isAnonymousUser = user === null;
          const credentials = isAnonymousUser ? null : user.getCredentials();

          const authenticator =
            this.openApiParser.getAuthenticatorByRoute(route);

          let response;
          try {
            response = await performRequest(route, authenticator, credentials);
          } catch (e: unknown) {
            // todo: create two Error instances
            if (e instanceof Error) {
              console.error(e.message);

              console.warn(
                `Could not impersonate user '${user}' while trying to reach route ${route.method} ${route.url}.
            This test will be skipped and further testcases for user '${user}' will be cancelled.
            Please check whether you provided correct credentials and the authentication setup is properly configured.`,
              );

              if (user !== null) {
                blockedUserIdentifiers.push(user.getCredentials().identifier);
              }

              testResult.testResult = "⏭️";
              skip(e.message);
            }

            return;
          }

          /*       const isUnauthorized =
            response.statusCode === HTTP_UNAUTHORIZED_STATUS_CODE;

          if (isUnauthorized && !isAnonymousUser) {
          // todo: make route toString()
          const { retryCount } = response;
          const recurringAuthenticationProblem = retryCount > 0;

          console.warn(
            `Although the user ${user} has been authenticated using the authentication endpoint, the server responded with status code ${HTTP_UNAUTHORIZED_STATUS_CODE} when trying to access route ${route.method} ${route.url}.
            ${recurringAuthenticationProblem ? `The server kept responding with status code ${response.statusCode} after ${retryCount} retries have been made.` : `The server responded with status code ${response.statusCode}.`}
            This testcase will be skipped.
            Please check whether the credentials are correct and the authentication setup is properly configured.`,
          );

          t.skip(
            recurringAuthenticationProblem
              ? "Recurring authentication problem"
              : "Authentication problem",
          ); // todo: new state for skipped? currently only pass/fail
          return;
        }*/

          // todo: make it configurable what is considered as denied
          // for now, denied is when the corresponding status code (Forbidden) has been sent
          const { statusCode } = response;
          console.debug("STATUSCODE " + statusCode);

          let actual: AccessControlResult =
            statusCode === HTTP_FORBIDDEN_STATUS_CODE ? "denied" : "permitted";

          if (expectedRequestToBeAllowed) {
            // can be one of 2XX codes but could also be an error that occurred due to wrong syntax of request

            // todo: what about anonymous users? for them it should not be forbidden and also not unauthorized
            expect(statusCode).notToBe(HTTP_FORBIDDEN_STATUS_CODE);
          } else {
            // as anonymous user, unauthorized or forbidden is okay
            if (isAnonymousUser) {
              const requestForbidden = [
                HTTP_FORBIDDEN_STATUS_CODE, // todo: is forbidden really expected for users without authentication details or should it only be Unauthorized?
                HTTP_UNAUTHORIZED_STATUS_CODE,
              ].includes(statusCode);

              expect(requestForbidden).toBe(true);

              actual = requestForbidden ? "denied" : "permitted"; // todo: maybe rename to rejected (is either denied/unauthorized)
            } else {
              expect(statusCode).toBe(HTTP_FORBIDDEN_STATUS_CODE);
            }
          }

          testResult.actual = actual;
          //testResult.authenticator = authenticator;
          testResult.testResult = actual === expected ? "✅" : "❌";
        },
      };
    });
  }
}
