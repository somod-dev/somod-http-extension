# SOMOD Http Extension

---

This is an extension project written in accrodance with SOMOD [extensions](https://docs.somod.dev/reference/main-concepts/extensions) and [middleware](https://docs.somod.dev/reference/main-concepts/serverless/middlewares) specifications.

> This documentation assumes users have prior knowledge of [SOMOD](https://docs.somod.dev/) and [JsonSchema7].

## **Extension**

This extension takes routes configuraion file and transform the configuration into an easily accessible run time format for [library](#lib). Three hooks are used to achieve this transformation.

- `Routes configuratoin file`

  this is an yaml file

```yaml
routes:
  <route>:
    method: <http mehtod>
    schemas?:
      header?: <json-schema>
      body?: <json-schema>
      pathParams?: <json-schema>
      queryParams?: <json-schema>
```

`<route>` and `method` are mandatory

```bash

project-root
    |
    +-- node_modules                                                         --+
    |       +-- module-a                                                       |
    |               +-- build/                                                 | FROM DEPENDENCIES
    |                     +-- serverless/                                      |
    |                           +-- functions/                                 |
    |                                   +-- function1.js                       |
    |                                   +-- function1.http.json                |
    |                                                                        --+
    |
    +-- build/                                                               --+
    |     +-- serverless/                                                      |
    |           +-- functions/                                                 |
    |                   +-- function1.js                                       |
    |                   +-- function1.http.json                                |
    |                                                                        --+
    +-- .somod/                                                               --+
    |     +-- serverless/                                                       |
    |             +-- functions/{moduleName}/{functionName}/                    | BUNDLED
    |             +-- functionLayers/module-a/function1/                        |
    |                               +--<route><http mehtod>header.js            |
    |                               +--<route><http mehtod>body.js              |
    |                               +--<route><http mehtod>pathParams.js        |
    |                               +--<route><http mehtod>queryParams.js     --+
    |                                                                         --+
    +-- serverless/                                                           --+
    |   +-- functions/                                                          | FROM SOURCE
    |           +-- function1.ts                                                |
    |           +-- function1.http.yaml                                       --+


```

- `Hooks`

  ### prebuild

  validate `<function name>.http.yaml` file.

  ### build

  transform `<function name>.http.yaml` file to `<function name>.http.json` and put it inside build folder as shown above

  ### prepare

  - get all the <function name>.http.json files from current and installed modules, compile all `<json-schema>` and create <route><http mehtod><type>.js file under `.somod` directory as shown above.
  - create `routes.js` file under `.somod` directory as shown above. route.js file is similar to `<function name>.http.json` except `<json-schema>` is removed and a named export called `httpRoutes` is added.

  ## examples

  `<function name>.http.yaml`

  ```yaml
    routes:
  "/user/login":
    method: "POST"
    schemas:
      header:
        {
          $id: "https://example.com/bar.json",
          $schema: "http://json-schema.org/draft-07/schema#",
          type: "object",
          properties: { bar: { type: "string" } },
          required: ["bar"],
        }
      body:
        {
          $id: "https://example.com/bar.json",
          $schema: "http://json-schema.org/draft-07/schema#",
          type: "object",
          properties: { body: { type: "string" } },
          required: ["body"],
        }

  ```

  transformed `routes.js` file

  ```javascript
  export const httpRoutes = {
    routes: {
      "/user/login": {
        method: "POST",
        schemas: {
          header: true,
          body: true,
        },
      },
    },
  };
  ```

## **middleware**

One lambda fucntion can be connected to multiple routes and each route will have its own configuraion (refer [examples](#examples)), based on this configuratoin related values in `aws http event` will be validated.

route("/user/login") and http method("POST") combined should be unique inside the file, route and method received from event will be verified against given values.

4 schemas are allowed now - header, body, path parameters and query parameters and all are optional. Given schemas will be used to validate values received in event for all these types.

## **lambda-http**

lambda-http is a library which works with [aws http event](https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html#apigateway-example-event).

One lambda fucntion can be connected to multiple routes and each route will have its own configuraion (like url, path and vlidation schemas) defined in `<function name>.http.yaml`, based on this configuratoin related values in aws http event will be validated and parsed to create new object called [`HttpRequest`](#httprequest-object).

## Usage

create an object of `HttpLambda` and call `register` method to attach function to be called on specific route.

```typescript
import { HttpLambda } from "http-lambda";

const http = new HttpLambda();

const loginFn = (request: HttpRequest<TH, TP, TQ, TB>) => {
  ...
};

http.register("/user/login", "POST", ["event.context.somod-http-extension"] ,loginFn);
```

`event.context.somod-http-extension` will be the object creaed by `somod-http-extension` middleware

### register parameters

1. url
2. http method
3. nested properties of event object. can also be a proprty added by middleware.
4. function

### HttpRequest object

```typescript
type HttpRequest<TH, TP, TQ, TB> = {
  headers?: TH;
  pathParams?: TP;
  queryStringParameters?: TQ;
  body?: TB;
};

TH - Record<string, string>;
TP - Record<string, string>;
TQ - Record<string, string>;
TB - Record<string, unknown>;
```
