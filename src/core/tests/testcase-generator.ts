// todo: implement this & move function outside
// for now just dummy implementation
import { OpenAPIParser } from "../parsers/openapi-parser";
import { User } from "../policy/entities/user";
import { Route } from "../types";

export type TestDataset = Array<{
  user: User;
  route: Route;
  expectedRequestToBeAllowed: boolean;
}>;

export class TestcaseGenerator {
  constructor(private readonly openApiParser: OpenAPIParser) {}

  // todo: this shouldn't be async, solve async in source (OpenAPI parser)
  private getAllRoutes(): Array<Route> {
    // todo: generate full-formed URLs with parameters
    // todo: for now only query parameters and path parameters are supported, maybe add support for other types of parameters
    const urlsWithParameterInfo = this.openApiParser.getUrlsWithParameterInfo();

    // todo: combine this info with info about the resources and the relationship between them
    return [
      {
        url: "http://localhost:3333/admin/users",
        method: "get",
        // maybe include securitySchemeIdentifier here?
      },
      {
        url: "http://localhost:3333/admin/users/123",
        method: "get",
      },
      {
        url: "http://localhost:3333/basicauth",
        method: "get",
      },
      // todo: test with an url with query parameters
    ];
  }

  private getAllUsers(): Array<User> {
    // todo: gather all users from act.scan() setup
    const user1 = new User("niklas.haug@tha.de", "niklas.haug@tha.de");

    return [user1];
  }

  public generateTestDataset(): TestDataset {
    const users = this.getAllUsers();
    const routes = this.getAllRoutes();

    // todo: for every route, extract involved resources and their relationships
    // then: PolicyDecisionPoint.isAllowed(user, action, resource, resourceIdentifier)

    return routes.flatMap((route) =>
      users.map((user) => ({
        user,
        route,
        expectedRequestToBeAllowed: false,
      })),
    );
  }
}
