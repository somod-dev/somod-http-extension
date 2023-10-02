import { readYamlFileStore, readJsonFileStore } from "nodejs-file-utils";
import { join } from "path";
import { Extension, IContext, ServerlessTemplate } from "somod";
import {
  FILE_ROUTES_HTTP_JSON,
  FILE_TEMPLATE_YAML,
  PATH_BUILD,
  PATH_FUNCTIONS,
  PATH_HTTP_SCHEMAS,
  PATH_NODE_MODULES,
  PATH_SERVERLESS,
  PATH_SOMOD_WORKING_DIR,
  RESOURCE_TYPE_FUNCTION
} from "./constants";
import { existsSync } from "fs";
import { Routes } from "./routes-schema";
import { copyFile, mkdir, writeFile } from "fs/promises";
import { getHttpSchemaPath } from "./utils";
import { getCompiledValidator } from "decorated-ajv";

const getFunctionMeta = function (CodeUri: string) {
  // Reffering to this code to find the module and function name
  // https://github.com/somod-dev/somod/blob/main/packages/lib/src/utils/serverless/keywords/function.ts#L278-L279

  const codeUriParts = CodeUri.split("/");

  const functionName = codeUriParts.pop() as string;
  let moduleName = codeUriParts.pop() as string;

  if (codeUriParts[codeUriParts.length - 1] != PATH_SERVERLESS) {
    moduleName = codeUriParts.pop() + "/" + moduleName;
  }

  return { name: functionName, module: moduleName };
};

const getRoutesHttpJsonPath = (
  dir: string,
  rootModuleName: string,
  name: string,
  module: string
) => {
  const routesJsonPath = [
    PATH_BUILD,
    PATH_SERVERLESS,
    PATH_FUNCTIONS,
    name + ".http.json"
  ];

  if (module != rootModuleName) {
    routesJsonPath.unshift(PATH_NODE_MODULES, module);
  }
  routesJsonPath.unshift(dir);
  return join(...routesJsonPath);
};

const getFunctionsWithRoutes = async (context: IContext) => {
  const templateYaml = (await readYamlFileStore(
    join(context.dir, FILE_TEMPLATE_YAML)
  )) as ServerlessTemplate;

  const functionResources = Object.values(templateYaml.Resources).filter(
    resource =>
      resource.Type == RESOURCE_TYPE_FUNCTION && !!resource.Properties.CodeUri // Does not work with InlineCode in the Template. Function must have CodeUri instead
  );

  const functionsMeta = functionResources.map(resource =>
    getFunctionMeta(resource.Properties.CodeUri as string)
  );

  return functionsMeta.filter(({ name, module }) =>
    existsSync(
      getRoutesHttpJsonPath(
        context.dir,
        context.moduleHandler.roodModuleName,
        name,
        module
      )
    )
  );
};

const insertCompiledHttpSchemaIntoFunction = async (
  context: IContext,
  name: string,
  module: string
) => {
  const routesJsonPath = getRoutesHttpJsonPath(
    context.dir,
    context.moduleHandler.roodModuleName,
    name,
    module
  );

  const routes = (await readJsonFileStore(routesJsonPath)) as Routes;

  const httpSchemasPath = join(
    context.dir,
    PATH_SOMOD_WORKING_DIR,
    PATH_SERVERLESS,
    PATH_FUNCTIONS,
    module,
    name,
    PATH_HTTP_SCHEMAS
  );

  await mkdir(httpSchemasPath, { recursive: true });

  await copyFile(routesJsonPath, join(httpSchemasPath, FILE_ROUTES_HTTP_JSON));

  await Promise.all(
    Object.keys(routes).map(async path => {
      await Promise.all(
        Object.keys(routes[path]).map(async method => {
          const parameters = routes[path][method].parameters;
          if (parameters !== undefined) {
            await Promise.all(
              parameters.map(async parameter => {
                const schemaFileName = getHttpSchemaPath(path, method, {
                  in: parameter.in,
                  name: parameter.name
                });

                const compiledSchema = await getCompiledValidator(
                  parameter.schema
                );

                await writeFile(
                  join(httpSchemasPath, schemaFileName),
                  compiledSchema
                );
              })
            );
          }
          const body = routes[path][method].body;
          if (body) {
            const schemaFileName = getHttpSchemaPath(path, method, "body");
            const compiledSchema = await getCompiledValidator(body.schema);
            await writeFile(
              join(httpSchemasPath, schemaFileName),
              compiledSchema
            );
          }
        })
      );
    })
  );
};

/**
 * parse template.yaml and find AWS::Serverless::Function
 * get all module names and for each module get routes configuration
 * generate schema compiled files and save inside .somod/serverless/functions/<module>/<function>/http-schemas/
 */
export const prepare: Extension["prepare"] = async context => {
  if (!existsSync(join(context.dir, FILE_TEMPLATE_YAML))) {
    // eslint-disable-next-line no-console
    console.log("Skipping prepare. No template.yaml found");
    return;
  }

  const functionsWithRoutes = await getFunctionsWithRoutes(context);

  await Promise.all(
    functionsWithRoutes.map(async ({ name, module }) => {
      await insertCompiledHttpSchemaIntoFunction(context, name, module);
    })
  );
};
