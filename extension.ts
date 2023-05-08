/* eslint-disable no-console */
import {
  JSONSchema7,
  Violation,
  getCompiledValidator,
  validate
} from "decorated-ajv";
import fs from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  readJsonFileStore,
  readYamlFileStore,
  saveYamlFileStore,
  updateYamlFileStore
} from "nodejs-file-utils";
import { Extension, IContext, Module } from "somod";
import { schema } from "./routes-schema";
import { RouteConfigOptions, Routes } from "./lib/types";
import { encodeFileSystem } from "./lib/utils";

type Hook = Extension["prebuild"];

const SERVERLESS = "serverless";
const FUNCTIONS = "functions";
const LAYERS = "Layers";

const DOT_TS = ".ts";
const HTTP_YAML = ".http.yaml";
const HTTP_JSON = ".http.josn";
const BUILD = "build";
const TEMPLATE_YAML = "template.yaml";
declare type JSONObjectType = Record<string, unknown>;
const RESOURCES = "Resources";
const AWS_SERVERLESS_FUNCTION = "AWS::Serverless::Function";
const AWS_SERVERLESS_LAYER_VERSION = "AWS::Serverless::LayerVersion";
const TYPE = "Type";
const PROPERTIES = "Properties";
const CODE_URI = "CodeUri";
const SOMOD = ".somod";
const FUNCTION_LAYERS = "functionLayers";
const ROUTE_FILE_NAME = "routes.js";

export const prebuild: Hook = async (context: IContext) => {
  const rootModule = context.moduleHandler.getModule(
    context.moduleHandler.roodModuleName
  );
  const routes = await getRouteFiles(rootModule);

  for (const route of routes) {
    /**
     * TODO: check the schema of yaml file
     */

    const routePath = path.join(
      rootModule.module.packageLocation,
      SERVERLESS,
      FUNCTIONS,
      route + HTTP_YAML
    );

    const doc = await readYamlFileStore(routePath);
    const violations: Violation[] = await validate(schema, doc);
    if (violations.length > 0) {
      console.log("error - " + violations[0].message);
      throw violations[0].message;
    }
  }
};

export const build: Hook = async (context: IContext) => {
  const rootModule = context.moduleHandler.getModule(
    context.moduleHandler.roodModuleName
  );
  const routes = await getRouteFiles(rootModule);

  /**
   * TODO: convert the yaml file to json file and put it inside build folder
   */

  for (const route of routes) {
    const routePath = path.join(
      rootModule.module.packageLocation,
      SERVERLESS,
      FUNCTIONS,
      route + HTTP_YAML
    );

    const routeJsonPath = path.join(
      rootModule.module.packageLocation,
      BUILD,
      SERVERLESS,
      FUNCTIONS,
      route + HTTP_JSON
    );

    const doc = await readYamlFileStore(routePath);

    /**
     * TODO: merge prebuild and build
     */
    await writeFile(routeJsonPath, JSON.stringify(doc));
  }
};

export const prepare: Hook = async (context: IContext) => {
  const root = context.moduleHandler.getModule(
    context.moduleHandler.roodModuleName
  );

  /**
   * TODO:parse template.yaml and find functions
   * then find module names and go to modules and find getconfigs
   * then generate schema compiled files and save inside .somod
   * create the layer in template.yaml and give contentUri path of previous step.
   */
  const templateFile = path.join(root.module.packageLocation, TEMPLATE_YAML);
  const template: JSONObjectType = await readYamlFileStore(templateFile);

  const functions = parseFunctions(template);

  await Promise.all(
    functions.map(async (func: JSONObjectType) => {
      const props = func[PROPERTIES] as JSONObjectType;
      let codeUri = props[CODE_URI] as string;
      codeUri = codeUri.replace(
        path.join(SOMOD, SERVERLESS, FUNCTIONS) + "/",
        ""
      );

      // get module name
      /**
       * TODO: recheck this syntax
       */
      const ps = codeUri.split("/");
      ps.pop();
      const moduleName = ps.join("/");

      //get module path from name
      const module = context.moduleHandler.getModule(moduleName);
      const __routeFileNames = await getRouteFiles(module);

      for (const __routeFileName of __routeFileNames) {
        const _routeFilePath = path.join(
          module.module.packageLocation,
          BUILD,
          SERVERLESS,
          FUNCTIONS,
          __routeFileName + HTTP_JSON
        );

        const _routesTransformed = {} as Routes;
        const routes = await readJsonFileStore(_routeFilePath);
        await Promise.all(
          Object.keys(routes).map(async routeKey => {
            const routeConfigOptions = routes[routeKey] as RouteConfigOptions;
            _routesTransformed[routeKey] = { schemas: [] };

            const _schemaDir = path.join(
              root.module.packageLocation,
              SOMOD,
              SERVERLESS,
              FUNCTION_LAYERS,
              moduleName,
              __routeFileName
            );

            await Promise.all(
              Object.keys(routeConfigOptions.schemas).map(async key => {
                const _schemaFileName = encodeFileSystem(routeKey, key);
                const _schemaFilePath = path.join(_schemaDir, _schemaFileName);

                await mkdir(_schemaDir, { recursive: true });

                await writeCompiledSchema(
                  _schemaFilePath,
                  routeConfigOptions.schemas[key]
                );
                _routesTransformed[routeKey].schemas.push(key);
              })
            );

            const _routesOutputPath = path.join(_schemaDir, ROUTE_FILE_NAME);

            await writeFile(
              _routesOutputPath,
              "export const routes = " + JSON.stringify(_routesTransformed)
            );

            const layer = {
              Type: AWS_SERVERLESS_LAYER_VERSION,
              Properties: {
                ContentUri: _schemaDir
              }
            };

            const layers = (func["Properties"] as JSONObjectType)[
              LAYERS
            ] as JSONObjectType[];

            layers.push(layer);
          })
        );
      }
    })
  );
  updateYamlFileStore(templateFile, template);
  saveYamlFileStore(templateFile);
};

const writeCompiledSchema = async (fileName: string, schema: JSONSchema7) => {
  const standaloneValidator = await getCompiledValidator(schema);

  await writeFile(fileName, standaloneValidator);
};

const getRouteFiles = async ({
  module
}: {
  module: Module;
}): Promise<string[]> => {
  const functionsDir = path.join(module.packageLocation, SERVERLESS, FUNCTIONS);
  let routes: string[] = [];
  if (
    fs.existsSync(path.join(module.packageLocation, SERVERLESS)) &&
    fs.existsSync(functionsDir)
  ) {
    try {
      const files = await readdir(functionsDir, { withFileTypes: true });

      const functions = files
        .filter(file => file.name.endsWith(DOT_TS))
        .map(file => {
          return file.name.replace(DOT_TS, "");
        });

      routes = files
        .filter(file => file.name.endsWith(HTTP_YAML))
        .map(file => {
          return file.name.replace(HTTP_YAML, "");
        });

      routes = routes.filter(config => functions.includes(config));
    } catch (err) {
      throw new Error(err);
    }
  }
  return routes;
};

const parseFunctions = (template: JSONObjectType) => {
  const resouces = template[RESOURCES] as JSONObjectType[];

  const functions: JSONObjectType[] = [];
  Object.keys(resouces).forEach(key => {
    if (resouces[key][TYPE] === AWS_SERVERLESS_FUNCTION) {
      functions.push(resouces[key]);
    }
  });
  return functions;
};

export const functionMiddlewares = ["httpMiddleware1"];
