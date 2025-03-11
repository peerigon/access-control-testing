# Access Control Testing Tool

This TypeScript tool automates testing web applications for **Broken Access Control** vulnerabilities based on an enhanced **OpenAPI specification**. Developed by [Peerigon](https://peerigon.com/) as part of a bachelor's thesis, it leverages a specially annotated OpenAPI specification to explicitly determine which resources an API endpoint accesses and the type of access involved. For details on annotations, see [Annotating OpenAPI](#2-openapi-annotate).

The tool generates test cases based on defined user-resource relationships and verifies whether the web application's access control policy is correctly enforced. Results are clearly displayed in a console-based report.

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
yalc add access-control-testing
npm install
```

---

## Limitations

Additional security mechanisms like **CSRF tokens**, **rate limiting**, or **IP blocking** should be disabled during testing. Otherwise, they may interfere with the testing process. Temporarily disable such protections via environment variables or similar mechanisms to ensure accurate test results.

Currently, only one resource per operation can be defined. The tool does not support multiple resources in a single route (e.g., `/groups/:groupId/members/:memberId`). Simple routes like `/members/:memberId` are fully supported.

Also, the tool only supports APIs that communicate via JSON. XML or other data formats are not yet supported.

---

## Assumptions

The tool assumes that tested web applications follow this sequence when handling requests:

1. User identity verification (*Authentication*)
2. User permission verification (*Authorization*)
3. Request syntax and semantic validation

If this order is not maintained, the tool may produce inaccurate test outcomes.

---

## Setup

### 1. Provide OpenAPI Specification

Make your application's OpenAPI specification available through your web server in either JSON or YAML format.

> [!IMPORTANT]  
> Local file paths are not allowed for security reasons. Instead, you must use an `http://` or `https://` URL.

---

### 2. Annotating Resources

First, determine clearly which API routes represent resources and the type of access (`create`, `read`, `update`, `delete`) they involve.

The following custom annotations (prefixed with `x-act-`) are required to specify resources and access types:

- `x-act-resource-name`: Indicates the resource accessed by the operation.
- `x-act-resource-access`: Specifies the access type (`create`, `read`, `update`, `delete`).

Annotations can be provided inline or nested:

<details open>
<summary>Example of Inline Annotation</summary>

```yaml
x-act-resource-name: Todo
x-act-resource-access: read
```
</details>

<details open>
<summary>Example of Nested Annotation</summary>

```yaml
x-act:
  resource-name: Todo
  resource-access: read
```
</details>

<details>
<summary>Full Example of Resource Annotations</summary>

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
</details>

Additionally, define security schemes in your OpenAPI file, either globally or at the individual operation level. For more details, refer to the [Security Scheme documentation](https://swagger.io/docs/specification/authentication/).

---

### 3. Annotating Authentication Endpoints

Ensure you have a valid security scheme defined. Refer to the [Security Scheme documentation](https://learn.openapis.org/specification/security.html).

To automate authentication, use these annotations:

- `x-act-auth-endpoint`: Matches your security scheme key.
- `x-act-auth-field`:
  - `identifier`: Username/email.
  - `password`: Password.
  - `token`: Token field in response.

> [!IMPORTANT]  
> For bearer authentication, the token field must be at the top level of the response. Nested fields like `{ data: { token: "<token>" } }` are currently not supported.


<details>
<summary>Example of an annotated Bearer token endpoint</summary>

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
        '200':
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

Define users and resources clearly, ensuring names match exactly (case-sensitive) those in the OpenAPI annotations.

<details open>
<summary>Example of User-Resource Definition</summary>

```typescript
import { User, Resource } from 'access-control-testing'

const user1 = new User('myusername', 'mysecretpassword')
const todoResource = new Resource('Todo') // Matches 'Todo' exactly

user1.canView(todoResource, 123)   // user1 can view Todo instance with identifier 123
user1.canEdit(todoResource, 123)   // user1 can edit Todo instance with identifier 123
user1.canDelete(todoResource, 123) // user1 can delete Todo instance with identifier 123
user1.canCreate(todoResource)      // user1 can create new Todo instances
user1.owns(todoResource)           // user1 owns created Todo instances
```
</details>

---

### 5. Configuration Options

Provide the following properties when configuring the tool:

- `apiBaseUrl`: Base URL of the API under test.
- `openApiUrl`: URL to your annotated OpenAPI spec.
- `users`: Array of user objects.
- `resources`: Array of resource objects.

<details open>
<summary>Example of Tool Configuration</summary>

```typescript
const users = [user1]
const resources = [todoResource]

const act = new Act({
  apiBaseUrl: 'http://localhost:3333/',
  openApiUrl: 'http://localhost:3333/openapi.yml',
  users,
  resources,
})
```
</details>

---

## Running Tests

After setup, tests are generated and executed as follows:

<details open>
<summary>Example of Running Tests</summary>

```typescript
import { Act, NodeTestRunner } from 'access-control-testing'

// Assuming setup steps are completed and `act` instance is configured
const testCases = await act.generateTestCases()
const testRunner = new NodeTestRunner()

await testRunner.run(testCases)
```
</details>

Results are automatically presented in a clear tabular format in the console.
