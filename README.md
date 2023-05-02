# SOMOD Http Extension

---

This is an extension and middleware project written in accrodance with SOMOD [extensions](https://docs.somod.dev/reference/main-concepts/extensions) and [middleware](https://docs.somod.dev/reference/main-concepts/serverless/middlewares) specifications.

> This documentation assumes users have prior knowledge of [SOMOD](https://docs.somod.dev/) and its concepts.

## **Extension**

This extension takes routes configuraion file and transform the configuration into an easily accessible run time format for [middleware](#middleware). Three hooks are used to achieve this transformation.

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
  "/user2/login":
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
      "/user2/login": {
        method: "POST",
        schemas: {
          header: true,
          body: true,
        },
      },
    },
  };
  ```

## **Middleware**
