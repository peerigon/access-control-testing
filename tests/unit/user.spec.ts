import { test } from "@japa/runner";
import { User } from "../../src/core/policy/entities/user.ts";

test.group("User", () => {
  test("error is thrown when creating two users with the same identifier", () => {
    new User("user1", "password");

    new User("user1", "anotherpassword");
  }).throws(
    "User with identifier 'user1' can't be defined twice as it has already been defined before.",
  );
});
