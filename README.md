<div align="center">
  <h1 align="center">Access Control Testing Tool</h1>
  <p align="center">Automated detection of Broken Access Control vulnerabilities based on enhanced OpenAPI specifications</p>
</div>

---

## Introduction

This tool automates testing web applications for **Broken Access Control** vulnerabilities based on an enhanced **OpenAPI specification**. Developed by [Peerigon](https://peerigon.com/) as part of a bachelor's thesis, it leverages a specially annotated OpenAPI specification to explicitly determine which resources an API endpoint accesses and the type of access involved. For details on annotations, see [Annotating Resources](#2-annotating-resources).

The tool generates test cases based on defined user-resource relationships and [executes them through a test runner](#running-tests), sending requests to the application and verifying whether each request was permitted or denied. The outcome is then compared to the expected behavior defined through a policy replication, enabled by [user-resource relationship definitions](#4-defining-users-and-resources). Results are displayed in a console-based report.

---

## Installation

Since the tool is not yet published on npm, installation is done using [yalc](https://github.com/wclr/yalc).

Install `yalc` globally first:

```bash
npm install -g yalc
```

Clone this repository, navigate to the directory, and run:

```bash
npm install
npm run publish:local
```

Then, inside your project's directory, add the tool:

```bash
npx yalc add access-control-testing
npm install
```

---

## Limitations

Additional security mechanisms like **CSRF tokens**, **rate limiting**, or **IP blocking** should be disabled during testing. Otherwise, they may interfere with the testing process. For example, a `403 Forbidden` status code caused by IP blocking might be misinterpreted by the tool. Temporarily disable such protections via environment variables or similar mechanisms to ensure accurate test results.

Currently, only one resource per operation can be defined. The tool does not support multiple resources in a single route (e.g., `/groups/:groupId/members/:memberId`). Simple routes like `/members/:memberId` are fully supported.

Also, the tool only supports APIs communicating via JSON. XML or other formats are not yet supported.

---

## Assumptions

The tool assumes tested web applications follow this sequence when handling requests:

1. User identity verification (_Authentication_)
2. User permission verification (_Authorization_)
3. Request syntax and semantic validation

If this order is not maintained, the tool may produce inaccurate test outcomes.

---

## Setup

### 1. Provide OpenAPI Specification

Make your application's OpenAPI specification available through your web server in either JSON or YAML format.

> [!IMPORTANT]  
> Local file paths are not allowed for security reasons. Instead, you must use a URL that starts with `http://` or `https://`.

---

### 2. Annotating Resources

First, determine clearly which API routes represent resources and the type of access (`create`, `read`, `update`, `delete`) they involve.

The following custom annotations (prefixed with `x-act-`) are required to specify resources and access types:

- `x-act-resource-name`: Indicates the resource accessed.
- `x-act-resource-access`: Specifies access type.

Annotations can be inline or nested under `x-act`:

<details open>
<summary><strong>Example of Inline Annotation</strong></summary>

```yaml
x-act-resource-name: Todo
x-act-resource-access: read
```

</details>

<details open>
<summary><strong>Example of Nested Annotation</strong></summary>

```yaml
x-act:
  resource-name: Todo
  resource-access: read
```

</details>

<details>
<summary><strong>Complete Example of OpenAPI Annotations</strong></summary>

```yaml
paths:
  /todos:
    get:
      # ...
      x-act:
        resource-name: Todo
        resource-access: read
    post:
      # ...
      x-act:
        resource-name: Todo
        resource-access: create

  /todos/{id}:
    # ...
    get:
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
          x-act:
            resource-name: Todo
            resource-access: read
```

</details>

---

### 3. Annotating Authentication Endpoints

Before annotating authentication endpoints, ensure a valid security scheme is defined in your OpenAPI specification. See the [Security Scheme documentation](https://learn.openapis.org/specification/security.html).

Use these annotations to allow the tool to authenticate automatically:

- `x-act-auth-endpoint`: Must match your defined security scheme key and must be provided on operation-level.
- `x-act-auth-field`: Defines the relevant fields for authentication and must be set to one of the following valid types:

  | Type         | Description                                                                                          |
  |--------------|------------------------------------------------------------------------------------------------------|
  | `identifier` | Specifies the field in the request body that contains the user identifier (e.g., username or email). |
  | `password`   | Defines the field in the request body that holds the user's password.                                |
  | `token`      | Specifies the field in the response body where the authentication token is returned.                 |

Each value must be explicitly defined either as `x-act-auth-field-type` directly or as follows:

```yaml
x-act-auth-field:
  type: identifier | password | token
```

> [!WARNING]  
> For bearer authentication, the token field must be at the top level of the response.  
> Nested fields like `{ data: { token: "<token>" } }` are currently not supported.

<details>
<summary><strong>Example of an Authentication Endpoint (Bearer)</strong></summary>

```yaml
paths:
  /login/bearer:
    post:
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                  x-act-auth-field:
                    type: identifier
                password:
                  type: string
                  x-act-auth-field:
                    type: password
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                    x-act-auth-field:
                      type: token
      x-act-auth-endpoint: bearerHttpAuthentication
```

</details>

---

### 4. Defining Users and Resources

Define user-resource relationships explicitly. Resource names must match exactly (case-sensitive) the values used in the OpenAPI annotations (`x-act-resource-name`):

<details open>
<summary><strong>Example of User-Resource Definition</strong></summary>

```typescript
import { Resource, User } from "access-control-testing";

const user1 = new User("myusername", "mysecretpassword");
const todoResource = new Resource("Todo"); // Name must exactly match OpenAPI spec annotation

user1.canView(todoResource, 123); // user1 can view Todo instance with identifier 123
user1.canEdit(todoResource, 123); // user1 can edit Todo instance with identifier 123
user1.canDelete(todoResource, 123); // user1 can delete Todo instance with identifier 123
user1.canCreate(todoResource); // user1 can create new Todo instances
user1.owns(todoResource); // user1 owns created Todo instances
```

</details>

---

### 5. Configuration Options

Provide the following properties when configuring the tool:

- `apiBaseUrl`: The base URL where your API is accessible. It must be present in the `servers` array of the OpenAPI spec.
- `openApiUrl`: URL pointing to your annotated OpenAPI spec.
- `users`: Array of defined users.
- `resources`: Array of defined resources.

> [!WARNING]  
> The tool currently does not support templates for the `apiBaseUrl` inside of the `servers` array of the OpenAPI spec.

<details open>
<summary><strong>Example of Tool Configuration</strong></summary>

```typescript
import { Act, NodeTestRunner, Resource, User } from "access-control-testing";

const users = [user1];
const resources = [todoResource];

const act = new Act({
  apiBaseUrl: "http://localhost:3333/",
  openApiUrl: "http://localhost:3333/openapi.yml",
  users,
  resources,
});
```

</details>

---

## Running Tests

Once all setup steps are completed, you can generate test cases using `generateTestCases()` and run them with a test runner using `.run()`.

Tests can be run with any test runner by extending the abstract class `TestRunner`.  
To use the built-in Node.js test runner, the adapter `NodeTestRunner` is available (requires Node.js version 18 or higher).

<details open>
<summary><strong>Example of Running Tests</strong></summary>

```typescript
import { Act, NodeTestRunner, Resource, User } from "access-control-testing";

// Assuming setup steps are completed and `act` instance is configured
const testCases = await act.generateTestCases();
const testRunner = new NodeTestRunner();

await testRunner.run(testCases);
```

</details>

Results are automatically presented in a clear tabular format in the console.
