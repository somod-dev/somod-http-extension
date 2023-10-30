import { Extension, IContext } from "somod";
import { join } from "path";
import {
  KEYWORD_SOMOD_FUNCTION,
  PATH_FUNCTIONS,
  PATH_SERVERLESS,
  RESOURCE_TYPE_FUNCTION,
  SOMOD_HTTP_EXTENSION
} from "./constants";
import { readdir } from "fs/promises";
import { existsSync } from "fs";
import { getValidator, validate, Violation } from "decorated-ajv";
import { schema as httpYamlSchema } from "./routes-schema";
import { readYamlFileStore } from "nodejs-file-utils";
import chalk from "chalk";

/**
 * Validates the schema of all `serverless/functions/<function_name>.http.yaml`
 *
 */
export const validateHttpYamlFilesSchema = async (context: IContext) => {
  const functionsDir = join(context.dir, PATH_SERVERLESS, PATH_FUNCTIONS);
  if (!existsSync(functionsDir)) {
    // don't do anything if functionsDir does not exist
    return;
  }
  const httpYamlFiles = (await readdir(functionsDir)).filter(f =>
    f.endsWith(".http.yaml")
  );
  const httpYamlFileViolations: Record<string, Violation[]> = {};
  const schemaValidator = await getValidator(httpYamlSchema);
  for (const httpYamlFile of httpYamlFiles) {
    const yamlContent = await readYamlFileStore(
      join(functionsDir, httpYamlFile)
    );
    const violations = await validate({}, yamlContent, schemaValidator);
    if (violations.length > 0) {
      httpYamlFileViolations[httpYamlFile] = violations;
    }
  }
  if (Object.keys(httpYamlFileViolations).length > 0) {
    throw new Error(
      `Error validating the .http.yaml files : (from ${SOMOD_HTTP_EXTENSION}): \n${Object.keys(
        httpYamlFileViolations
      ).map(httpYamlFile => {
        return ` ${httpYamlFile} has following errors\n${httpYamlFileViolations[
          httpYamlFile
        ].map(violation => {
          return `  ${violation.message} at ${violation.path}`;
        })}`;
      })}`
    );
  }
};

/**
 * Checks if the `.http.yaml` exists for functions that have somod-http-extension middleware
 *
 * | YAML | Middleware | Result  |
 * | -----| -----------| ----    |
 * | No   | No         | Valid   |
 * | No   | Yes        | Error   |
 * | Yes  | No         | Warning |
 * | Yes  | Yes        | Valid   |
 *
 */
export const validateHttpYamlFilesForMiddlewares = async (
  context: IContext
) => {
  const template = context.serverlessTemplateHandler.getTemplate(
    context.moduleHandler.roodModuleName
  );
  if (template == null) {
    return;
  }

  const functionsDir = join(context.dir, PATH_SERVERLESS, PATH_FUNCTIONS);
  const functionsWithHttpYamlFiles = existsSync(functionsDir)
    ? (await readdir(functionsDir))
        .filter(f => f.endsWith(".http.yaml"))
        .map(f => f.substring(0, f.length - ".http.yaml".length))
    : [];
  const functionsWithHttpYamlFilesMap = Object.fromEntries(
    functionsWithHttpYamlFiles.map(f => [f, true])
  );

  const functionsWithHttpMiddleware = Object.values(template.template.Resources)
    .filter(r => r.Type == RESOURCE_TYPE_FUNCTION)
    .map(r => ({
      name: r.Properties["CodeUri"]?.[KEYWORD_SOMOD_FUNCTION]?.name || "",
      middlewares: (r.Properties["CodeUri"]?.[KEYWORD_SOMOD_FUNCTION]?.[
        "middlewares"
      ] || []) as { module?: string; resource: string }[]
    }))
    .filter(f => {
      !f.middlewares.every(
        m =>
          !(
            m.module == SOMOD_HTTP_EXTENSION &&
            m.resource == "SomodHttpMiddleware"
          )
      );
    })
    .map(f => f.name);

  const functionsWithHttpMiddlewareMap = Object.fromEntries(
    functionsWithHttpMiddleware.map(f => [f, true])
  );

  const functionsWithNoFile = functionsWithHttpMiddleware.filter(
    f => !functionsWithHttpYamlFilesMap[f]
  );

  if (functionsWithNoFile.length > 0) {
    throw new Error(
      `Error: Following functions does not have .http.yaml files (from ${SOMOD_HTTP_EXTENSION})\n${functionsWithNoFile
        .map(f => ` ${f}`)
        .join("\n")}`
    );
  }

  const functionsWithNoMiddleware = functionsWithHttpYamlFiles.filter(
    f => !functionsWithHttpMiddlewareMap[f]
  );

  if (functionsWithNoMiddleware.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      chalk.yellow(
        `Warning: Following functions does not have SomodHttpMiddleware (from ${SOMOD_HTTP_EXTENSION})\n${functionsWithNoMiddleware
          .map(f => ` ${f}`)
          .join("\n")}`
      )
    );
  }
};

export const prebuild: Extension["prebuild"] = async context => {
  await validateHttpYamlFilesForMiddlewares(context);
  await validateHttpYamlFilesSchema(context);
};
