# SOMOD Http Extension

---

The [SOMOD](https://somod.dev) Extension to validate HTTP Request in Serverless Functions.

> This extensions works with Functions of type `HttpApi` Only.

## Install

Install as an npm package in somod modules

```bash
npm install somod-http-extension
```

## Usage

### Configure Routes and Schemas

Routes configuration for each serverless function can be provided using an yaml file at `serverless/functions/<function_name>.http.yaml`.

Example:

```yaml
# serverless/functions/user.http.yaml

/user/{userId}:
  GET:
    pathParameters:
      schema: # JSONSchema7
        type: object
        required: [userId]
        properties:
          userId:
            type: string
            maxLength: 32
  POST:
    pathParameters:
      schema: # JSONSchema7
        type: object
        required: [userId]
        properties:
          userId:
            type: string
            maxLength: 32
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

This extension adds a middleware to validate and sanitize the incoming http request. The sanitized request can be accessed using the [middleware](https://docs.somod.dev/reference/main-concepts/serverless/middlewares)'s context using **`somod-http-request`** key.

Example:

```typescript
// serverless/functions/user.ts

const UserService = event => {
  const request = event.somodMiddlewareContext.get("somod-http-request");
  // use request to read the data from the incoming http request
};

export default UserService;
```

This extension also provides an utility library to create Serverless Functions with multiple routes easily. Refer to [RouteHandler](#routehandler) for more details

## Specification

### Structure of Routes configuration file

In general, routes configuration in `<function_name>.http.yaml` file follows below structure

```yaml
<path>:
  <method>:
    headers?:
      schema: <json schema>
    pathParameters?:
      schema: <json schema>
    queryStringParameters?:
      schema: <json schema>
    body?:
      parser?: <"text"|"json">
      schema: <json schema>
```

The complete JSONSchema is available [here](/routes-schema.ts)

### Type of the Request object

The request object accessed using `event.somodMiddlewareContext.get("somod-http-request")` has this type.

```typescript
type Request<T = unknown> = {
  route: string;
  method: string;
  pathParameters: Record<string, string>;
  queryStringParameters: Record<string, string>;
  headers: Record<string, string>;
  body: T;
};
```

The `Request` Type is available from this extension to use as below

```typescript
import { Request } from "somod-http-extension";
```

### HTTP Error Types

The validation middleware returns following HTTP error codes

- `404` - When the method and path in the incoming http request does not match any of the configured routes.
- `400` - When the parsing or validating the input fails with respect to configuration in the `<function_name>.http.yaml`.
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

The handler recieves the [sanitized request object](#type-of-the-request-object) and the raw event from the aws. The handler has to return a promise resolving to response.

> The Raw Event type and Response type is documented [here](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html) in the AWS specification.  
> This extension works with HTTP Payload format version 2.0 only

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
