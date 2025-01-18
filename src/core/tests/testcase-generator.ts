// todo: implement this & move function outside
// for now just dummy implementation
import { User } from "../entities/user";
import { Route } from "../types";

export class TestcaseGenerator {
  generateTestDataset(): Array<{
    user: User;
    route: Route;
    expectedRequestToBeAllowed: boolean;
  }> {
    const user1 = new User("niklas.haug@tha.de", "niklas.haug@tha.de");
    return [
      {
        user: user1,
        route: {
          url: "http://localhost:3333/admin/users",
          method: "get",
          // maybe include securitySchemeIdentifier here?
        },
        expectedRequestToBeAllowed: false, // todo: these objects will get mapped (.map) and the state here will be calculated by a dedicated function
      },
      // same object just to verify whether existing session gets properly reused
      {
        user: user1,
        route: {
          url: "http://localhost:3333/admin/users",
          method: "get",
        },
        expectedRequestToBeAllowed: false, // todo: these objects will get mapped (.map) and the state here will be calculated by a dedicated function
      },
      {
        user: user1,
        route: {
          url: "http://localhost:3333/admin/users/123",
          method: "get",
        },
        expectedRequestToBeAllowed: false, // todo: these objects will get mapped (.map) and the state here will be calculated by a dedicated function
      },
    ];
  }
}
