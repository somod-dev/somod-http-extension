# SOMOD Http Extension

---

This is an extension project written in accrodance with SOMOD [extensions](https://docs.somod.dev/reference/main-concepts/extensions) and [middleware](https://docs.somod.dev/reference/main-concepts/serverless/middlewares) specifications.

> This documentation assumes users have prior knowledge of [SOMOD](https://docs.somod.dev/) and [JsonSchema7](https://json-schema.org/).

**Install**

```bash
npm install somod-http-extension
```

## **Extension**

For each function written inside `serverless/functions/<function>.ts | .js` the extension looks for configuraion file(optional) named `<function>.http.yaml` in the same directory. All the dependent and current somod modules are scanned.

Each file `<function.ts>` can be configured to accept multiple routes. You can use library [HttpLambda](#httplambda) to map routes to functions.
routes defined inside `<function>.http.yaml` should match `AWS::Serverless::Function`(Events property) [`template.yaml`](https://docs.somod.dev/reference/main-concepts/serverless/template.yaml).

**`Routes configuratoin file`**

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
      schema: <json schema>
      parse: "string" | "object"
```

- example

```yaml
"/user/{userId}":
  "GET":
    headers:
      schema: { type: "object" }
    body:
      parser: "object"
      schema: { type: "object" }
  "POST": {}
```

`headers,pathParameters,queryStringParameters and body` are the keys of [aws event object](https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html#apigateway-example-event) only evnt version v2 is allowed.

- <path> and <method>

  Both are validated against the request received, if not matched 404 error will be thrown.

- <json schema>

  refer [josn schema](https://json-schema.org/)

- parser

  parser type to be used, default value is `object`. only `string` and `object` types are supported.

  > by defalut body type will be string in `aws event object`

- `Hooks`

  ### prebuild

  validate `<function>.http.yaml` file.

  ### build

  transform `<function>.http.yaml` file to `<function>.http.json` and put it inside build folder.

  ### prepare

  - transform <function>.http.json file and precompile the given schemas for better runtime performance.

## **middleware**

routes and schemas are validated against the request received. If not matched 404 error will be thrown. request body will be prased according to configuraiton.

## **HttpLambda**

this library maps functions to routes.

create an object of `HttpLambda` and call `register` method to attach function to be called on specific route.

```typescript
new HttpLambda().register(`<path>`, `<method>`, `<lambda fuction>`);
```

**example**

```typescript
import { HttpLambda } from "http-lambda";

const http = new HttpLambda();

const loginFn = (event) => {
  ...
};

http.register("/user/login/{userid}", "POST",loginFn);

export default http;

```
