# SOMOD Http Extension

---

This is an extension project written in accrodance with SOMOD [extensions](https://docs.somod.dev/reference/main-concepts/extensions) and [middleware](https://docs.somod.dev/reference/main-concepts/serverless/middlewares) specifications.

> This documentation assumes users have prior knowledge of [SOMOD](https://docs.somod.dev/) and [JsonSchema7](https://json-schema.org/).

## **Extension**

For each function written inside `serverless/functions/<function>.ts | .js` the extension looks for configuraion file named `<function>.html.yaml` in the same directory, and the actions are performed based on provided configuration value. All the dependent and current somod modules are scanned.

- `Routes configuratoin file`

```yaml
<path>:
  <method>:
    <event key>?:
      <key>?: <value>
```

- `<route>` and `method`

  used to validate the request at runtime.

- `<event key>`

  refers to keys (can be nested) of [event object](https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html#apigateway-example-event) only evnt version v2 is allowed.

- `<key>?: <value>`
  allowed key value pairs are

  1. schema : JsonSchema7

     used to validate value againt given schema

  2. type: string | object | integer

     used to parse the value

     > this type is allowed only for event key `body`

- `Hooks`

  ### prebuild

  validate `<function>.http.yaml` file.

  ### build

  transform `<function>.http.yaml` file to `<function>.http.json` and put it inside build folder as shown above

  ### prepare

  - get all the <function name>.http.json files from current and installed modules, compile all `<json-schema>` and create <route><http mehtod><type>.js file under `.somod` directory as shown above.
  - create `routes.js` file under `.somod` directory as shown above. route.js file is similar to `<function name>.http.json` except `<json-schema>` is removed and a named export called `httpRoutes` is added.

  ## examples

  `myFunction.http.yaml`

  ```yaml
  "/user/login/{userid}":
  "POST":
    header:
      schema:
        {
          $id: "https://example.com/bar.json",
          $schema: "http://json-schema.org/draft-07/schema#",
          type: "object",
          properties: { content-type: { type: "string" } },
          required: ["content-type"]
        }
    body:
      type: "object"
      schema:
        {
          $id: "https://example.com/bar.json",
          $schema: "http://json-schema.org/draft-07/schema#",
          type: "object",
          properties: { body: { type: "string" } },
          required: ["body"]
        }
  ```

## **middleware**

runtime validation fo configured routes and [event object](https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html#apigateway-example-event) keys against the given schema happens here.

## **library**

this is just a library to attach multiple functions to routes inside single file(`<function.ts>`).

create an object of `HttpLambda` and call `register` method to attach function to be called on specific route.

```typescript
new HttpLambda().register(`<route>`, `<method>`, `<lambda fuction>`);
```

**example**

```typescript
import { HttpLambda } from "http-lambda";

const http = new HttpLambda();

const loginFn = (event) => {
  ...
};

http.register("/user/login/{userid}", "POST",loginFn);
```
