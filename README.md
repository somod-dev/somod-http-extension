# SOMOD Http Extension

---

The [SOMOD](https://somod.dev) Extension Configure HTTP routes and validate incoming HTTP Requests in Serverless Functions.

> The middlware in this extension works with Functions of type `HttpApi` Only.

## Install

Install as an npm package in somod modules

```bash
npm install somod-http-extension
```

## Usage

### Attach the middleware to the Serverless Function

```yaml
Resources:
  MyHttpHandler:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri:
        SOMOD::Function:
          # ...
          middlewares:
            - module: somod-http-extension
              resource: SomodHttpMiddleware
      # ...
```

Refer to SOMOD's [Middleware](https://docs.somod.dev/reference/main-concepts/serverless/middlewares) reference for more information

### Configure Routes and Schemas

Routes configuration for each serverless function can be provided using a yaml file at `serverless/functions/<function_name>.http.yaml`.

Example:

```yaml
# serverless/functions/user.http.yaml

/user/{userId}:
  GET:
    parameters:
      - in: path
        name: userId
        schema:
          type: string
          maxLength: 32
        required: true
  POST:
    parameters:
      - in: path
        name: userId
        schema:
          type: string
          maxLength: 32
        required: true
    body:
      parser: json
      schema:
        type: object
        required: [name]
        properties:
          name:
            type: string
            maxLength: 32
          email:
            type: string
            format: email
```

### Access Sanitized Request

The sanitized request can be accessed using the [middleware](https://docs.somod.dev/reference/main-concepts/serverless/middlewares)'s context using the **`somod-http-request`** key.

Example:

```typescript
// serverless/functions/user.ts

const UserService = event => {
  const request = event.somodMiddlewareContext.get("somod-http-request");
  // use request to read the data from the incoming http request
};

export default UserService;
```

This module also provides a utility library to create Serverless Functions with multiple routes easily. Refer to [RouteHandler](#routehandler) for more details

## Specification

### Structure of Routes configuration file

In general, routes configuration in `<function_name>.http.yaml` file follows the below structure

```yaml
<path>:
  <method>:
    parameters?:
      - in: <"path", "query" or "header">
        name: <name of the parameter>
        schema: <json schema>
        required: <true if the parameter is mandatory>
    body?:
      parser?: <"text"|"json"|"formdata">. If not provided, automatically choosen based on the Content-Type Header (text is considered if automatic detection fails)
      schema: <json schema>
```

The complete JSONSchema is available [here](/lib/routes-schema.ts)

### Type of the Request object

The request object accessed using `event.somodMiddlewareContext.get("somod-http-request")` has this type.

```typescript
type Request<
  T = unknown,
  PT extends Record<string, unknown> = Record<string, unknown>,
  QT extends Record<string, unknown> = Record<string, unknown>,
  HT extends Record<string, unknown> = Record<string, unknown>
> = {
  route: string;
  method: string;
  parameters: {
    path: PT;
    query: QT;
    header: HT;
  };
  body: T;
};
```

The `Request` Type is available from this module to use (import as shown below)

```typescript
import { Request } from "somod-http-extension";
```

### HTTP Error Types

The validation middleware returns the following HTTP error codes

- `404` - When the method and path in the incoming http request do not match any of the configured routes.
- `400` - When the parsing or validating of the incoming request fails (following the configuration in `<function_name>.http.yaml`).
- `500` - Any other failures.

## RouteHandler

The `RouteHandler` is a wrapper javascript utility library to create serverless functions with multiple routes.

### Using the RouteHandler

```typescript
// serverless/function/user.ts
import { RouteHandler } from "somod-http-extension";

const handler = new RouteHandler();

handler.add("/user/{userId}", "get", getUserFunction);
handler.add("/user/{userId}", "post", updateUserFunction);

export default handler.handle();
```

### RouteHandler Specification

RouteHandler has 2 methods

- `add`

  ```typescript
  function add(
    path: string,
    method: string,
    handler: (request: Request, event: RawEvent) => Promise<Response>
  ): void {
    //
  }
  ```

  The handler receives the [sanitized request object](#type-of-the-request-object) and the raw event from AWS. The handler has to return a promise which resolves to the Response object.

  > The Raw Event type and Response type is documented [here](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html) in the AWS specification.  
  > This module works with HTTP Payload format version 2.0 only

- `handle`

  ```typescript
  function handle(): (event: RawEvent) => Promise<Response> {
    //
  }
  ```

  handle function returns the function which is a lambda function handler

## Issues

The project issues, features, and milestones are maintained in this GitHub repo.

Create issues or feature requests at https://github.com/somod-dev/somod-http-extension/issues

## Contributions

Please read our [CONTRIBUTING](https://github.com/somod-dev/somod/blob/main/CONTRIBUTING.md) guide before contributing to this project.
