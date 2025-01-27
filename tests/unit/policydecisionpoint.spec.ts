import { test } from "@japa/runner";
import { Resource } from "../../src/core/policy/entities/resource.ts";
import { User } from "../../src/core/policy/entities/user.ts";
import { PolicyDecisionPoint } from "../../src/core/policy/policy-decision-point.ts";

test.group("PolicyDecisionPoint.isAllowed", () => {
  test("allowed access is allowed", ({ expect }) => {
    const user1 = new User("user1", "password");
    const todoResource = new Resource("Todo");
    const resourceIdentifier = 123;

    user1.canView(todoResource, resourceIdentifier);

    const expectedAllowed = true;
    const actualAllowed = PolicyDecisionPoint.isAllowed(
      user1,
      "read",
      todoResource,
      resourceIdentifier,
    );

    expect(actualAllowed).toBe(expectedAllowed);
  });
});
