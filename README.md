# Access Control Testing Tool

This TypeScript tool automates the detection of **Broken Access Control** vulnerabilities in web applications based on an enhanced **OpenAPI specification**. Developed by [Peerigon](https://peerigon.com/) as part of a bachelor's thesis, it utilizes a specially annotated OpenAPI specification to explicitly determine which resources an API endpoint accesses and the type of access involved. For detailed information on annotation, see the section [Annotating OpenAPI](#2-openapi-annotate).

The tool generates randomized test cases based on defined user-resource relationships and verifies whether the web application's access control policy is correctly enforced. Results are clearly displayed in a console-based report.

---

## Installation

Since the tool is not yet published on npm, installation is done using [yalc](https://github.com/wclr/yalc).

Install `yalc` globally first:

```bash
npm install -g yalc
```

Clone this repository, navigate to the directory and run:

```bash
npm install
npm run publish:local
```

Then, inside your project's directory, add the tool:

```bash
yalc add access-control-testing
npm install
```

Um die Library zu updaten: `npx yalc update access-control-testing`
---

## Limitations

Additional security mechanisms like **CSRF tokens**, **rate limiting**, or **IP blocking** should be disabled during testing. Otherwise, they may interfere with the testing process. For example, a `403 Forbidden` status code caused by IP blocking might be misinterpreted by the tool. Temporarily disable such protections via environment variables or similar mechanisms to ensure accurate test results.

Currently, only one resource per operation can be defined. The tool does not support relationships involving multiple resources in a single route (e.g., `/groups/:groupId/members/:memberId`). Simple routes like `/members/:memberId` are fully supported.

---

## Assumptions

The tool assumes that tested web applications follow this sequence when handling requests:

1. User identity verification (*Authentication*)
2. User permission verification (*Authorization*)
3. Request syntax and semantic validation

If this order is not maintained, the tool may draw incorrect conclusions, resulting in inaccurate test outcomes.

---

## Setup

### 1. Provide OpenAPI Specification

Make the OpenAPI specification of your application available through your web server.
> [!IMPORTANT]
> A local file path is not allowed for security reasons. Instead, you must use an `http://` or `https://` URL.

### 2. Annotating the OpenAPI Specification

Define security schemes in your OpenAPI file, either globally or at the individual operation level. For more details, refer to the [Security Scheme documentation](https://swagger.io/docs/specification/authentication/).

Additionally, the following custom annotations (with the prefix `x-act-`) are required to specify resources and access types:

- `x-act-resource-name`: Indicates the resource accessed by the operation.
- `x-act-resource-access`: Specifies the access type (create, read, update, delete).

Example OpenAPI annotation:

```yaml
paths:
  /todos:
    get:
      # ...
      x-act:
        resource-name: User
        resource-access: read
    post:
      # ...
      x-act:
        resource-name: User
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
            resource-name: User
            resource-access: read
```

To describe the resource a given parameter refers to, `resource-name` and `resource-access` are used within the description of the parameter. To describe resources tied to the operation, the same fields can be used on the operation level.

### 3. Defining Users and Resources

Explicitly define the relationships between users and resources.

```typescript
import { User, Resource } from 'access-control-testing'

const user1 = new User('myusername', "mysecretpassword")
const todoResource = new Resource('Todo')

user1.canView(todoResource, 123)
user1.canEdit(todoResource, 123)
user1.canDelete(todoResource, 123)
user1.canCreate(todoResource)
user1.owns(todoResource)
```

These definitions are used to generate test cases and verify that users can access only permitted resources and operations.

### 4. Configuration Options

Pass the following configuration options to the constructor:

```typescript
const act = new Act({
  apiBaseUrl,
  openApiUrl,
  users,
  resources,
})
```

---

## Running Tests

Once all setup steps are completed, you can generate test cases using `generateTestCases()` and run them with a test runner using `.run()`.

Tests can be run with any test runner by extending the abstract class `TestRunner`. To use the built-in Node.js test runner, the adapter `NodeTestRunner` is available (requires Node.js version 18 or higher):

```typescript
import { Act, NodeTestRunner } from 'access-control-testing'

// Assuming setup steps are completed and `act` instance is configured
const testCases = await act.generateTestCases()

const testRunner = new NodeTestRunner()
await testRunner.run(testCases)
```

A detailed report is automatically displayed in tabular form in the console.

