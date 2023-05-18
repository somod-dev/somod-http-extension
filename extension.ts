import {
  JSONSchema7,
  Violation,
  getCompiledValidator,
  validate
} from "decorated-ajv";

import { mkdir, readdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import {
  readJsonFileStore,
  readYamlFileStore,
  saveYamlFileStore,
  updateYamlFileStore
} from "nodejs-file-utils";
import { Extension, IContext } from "somod";
import {
  AwsServerlessFunctionType,
  HttpMethodOptions,
  KeyOptions,
  Routes,
  RoutesTransformed
} from "./lib/types";
import { encodeFileSystem as encodeFileName } from "./lib/utils";
import { schema } from "./routes-schema";

type Hook = Extension["prebuild"];

export const SERVERLESS = "serverless";
export const FUNCTIONS = "functions";

const DOT_TS = ".ts";
const DOT_JS = ".js";
const HTTP_YAML = ".http.yaml";
const HTTP_JSON = ".http.json";
const BUILD = "build";
const TEMPLATE_YAML = "template.yaml";
declare type JSONObjectType = Record<string, unknown>;
const RESOURCES = "Resources";
const AWS_SERVERLESS_FUNCTION = "AWS::Serverless::Function";
const AWS_SERVERLESS_LAYER_VERSION = "AWS::Serverless::LayerVersion";
const TYPE = "Type";
const SOMOD = ".somod";
const FUNCTION_LAYERS = "functionLayers";
const ROUTE_FILE_NAME = "routes.js";
const SOMOD_HTTP_EXTENSION = "somod-http-extension";

export const prebuild: Hook = async (context: IContext) => {
  const rootModule = context.moduleHandler.getModule(
    context.moduleHandler.roodModuleName
  );

  const _functionsDir = join(
    rootModule.module.packageLocation,
    SERVERLESS,
    FUNCTIONS
  );
  const _rFileNames = await getRouteFileNames(_functionsDir, DOT_TS, HTTP_YAML);

  for (const _rFile of _rFileNames) {
    const routeFilePath = join(_functionsDir, _rFile + HTTP_YAML);

    const routes = await readYamlFileStore(routeFilePath);
    const violations: Violation[] = await validate(schema, routes);
    if (violations.length > 0) {
      throw new Error(violations.map(v => v.message).join("\n"));
    }
  }
};

export const build: Hook = async (context: IContext) => {
  const rootModule = context.moduleHandler.getModule(
    context.moduleHandler.roodModuleName
  );

  const _functionsDir = join(
    rootModule.module.packageLocation,
    SERVERLESS,
    FUNCTIONS
  );

  const _rFileNames = await getRouteFileNames(_functionsDir, DOT_TS, HTTP_YAML);

  for (const _rFileName of _rFileNames) {
    const routePath = join(_functionsDir, _rFileName + HTTP_YAML);
    const routeJsonPath = join(_functionsDir, _rFileName + HTTP_JSON);
    const routes = await readYamlFileStore(routePath);

    await writeFile(routeJsonPath, JSON.stringify(routes));
  }
};

/**
 * parse template.yaml and find AWS::Serverless::Function
 * get all module names and for each module get routes configuration
 * generate schema compiled files and save inside .somod
 * create the layer in template.yaml.
 */
export const prepare: Hook = async (context: IContext) => {
  const root = context.moduleHandler.getModule(
    context.moduleHandler.roodModuleName
  );

  const templateFile = join(root.module.packageLocation, TEMPLATE_YAML);
  const template: JSONObjectType = await readYamlFileStore(templateFile);
  if (!template) {
    return;
  }

  const functions = parseFunctions(template) as AwsServerlessFunctionType[];

  /***
   * TODO: create a folder with module name[or funciton name] and then move the code there
   */
  await Promise.all(
    functions.map(async (func: AwsServerlessFunctionType) => {
      const codeUri = func.Properties.CodeUri;

      const moduleName = getModuleNameFromCodeUri(codeUri);

      const module = context.moduleHandler.getModule(moduleName);

      const _functionsDir = join(
        module.module.packageLocation,
        BUILD,
        SERVERLESS,
        FUNCTIONS
      );

      const __routeFileNames = await getRouteFileNames(
        _functionsDir,
        DOT_JS,
        HTTP_JSON
      );

      for (const __routeFileName of __routeFileNames) {
        const _routeFilePath = join(_functionsDir, __routeFileName + HTTP_JSON);

        const _tRoutes = {} as RoutesTransformed;
        const routes = (await readJsonFileStore(_routeFilePath)) as Routes;
        await Promise.all(
          Object.keys(routes).map(async route => {
            const _rOptions = routes[route] as HttpMethodOptions;

            const _layerBaseDir = join(
              root.module.packageLocation,
              SOMOD,
              SERVERLESS,
              FUNCTION_LAYERS,
              moduleName,
              SOMOD_HTTP_EXTENSION + "-" + __routeFileName
            );
            const _layerDir = join(_layerBaseDir, SOMOD_HTTP_EXTENSION);

            await Promise.all(
              Object.keys(_rOptions).map(async method => {
                const _routekey = `${method} ${route}`;
                _tRoutes[_routekey] = {};

                await mkdir(_layerDir, { recursive: true });
                const _kOptions = _rOptions[method] as KeyOptions;

                await Promise.all(
                  Object.keys(_kOptions).map(async key => {
                    const _options = _kOptions[key];
                    _tRoutes[_routekey][key] = {};
                    if (_options.schema) {
                      const _sFileName = encodeFileName(_routekey, key);
                      const _sFilePath = join(_layerDir, _sFileName);
                      await writeCompiledSchema(
                        _sFilePath,
                        _options.schema as JSONSchema7
                      );
                      _tRoutes[_routekey][key].schema = true;
                    }

                    if (_options.parser) {
                      _tRoutes[_routekey][key].parser = _options.parser;
                    }
                  })
                );
              })
            );

            const _routesOutputPath = join(_layerDir, ROUTE_FILE_NAME);

            await writeFile(
              _routesOutputPath,
              "exports.routes = " + JSON.stringify(_tRoutes)
            );

            const layerResourceName =
              context.serverlessTemplateHandler.getSAMResourceLogicalId(
                SOMOD_HTTP_EXTENSION,
                context.getModuleHash(moduleName + __routeFileName) +
                  __routeFileName
              );
            const layer = {
              Type: AWS_SERVERLESS_LAYER_VERSION,
              Properties: {
                ContentUri: _layerBaseDir
              }
            };

            func.Properties.Layers.push({ Ref: layerResourceName });

            (template["Resources"] as JSONObjectType)[layerResourceName] =
              layer;
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

const getRouteFileNames = async (
  path: string,
  extensionOne: string,
  extensionTwo: string
): Promise<string[]> => {
  let routes: string[] = [];
  if (!existsSync(path)) {
    return routes;
  }

  try {
    const files = await readdir(path, { withFileTypes: true });

    const functions = files
      .filter(file => file.name.endsWith(extensionOne))
      .map(file => {
        return file.name.replace(extensionOne, "");
      });

    routes = files
      .filter(file => file.name.endsWith(extensionTwo))
      .map(file => {
        return file.name.replace(extensionTwo, "");
      });

    routes = routes.filter(config => functions.includes(config));
  } catch (err) {
    throw new Error(err);
  }

  return routes;
};

const getModuleNameFromCodeUri = (codeUri: string): string => {
  const _cUriPaths = codeUri.split("/");
  let moduleName = "";
  if (_cUriPaths.length > 2) {
    _cUriPaths.pop();
    moduleName = _cUriPaths.pop() ?? "";
    const scopeName = _cUriPaths.pop();
    if (scopeName?.startsWith("@")) {
      moduleName = scopeName + "/" + moduleName;
    }
  }
  return moduleName;
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
