import { Middleware } from "somod";
import { Routes } from "../../../lib/routes-schema";
import { join } from "path";
import {
  FILE_ROUTES_HTTP_JSON,
  MIDDLEWARE_CONTEXT_KEY,
  PATH_HTTP_SCHEMAS
} from "../../../lib/constants";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { validate } from "decorated-ajv";
import { ValidateFunction } from "ajv";
import { getHttpSchemaPath } from "../../../lib/utils";
import { decode } from "querystring";
import {
  BadRequestError,
  Event,
  NoRouteFoundError,
  Request,
  Result,
  RouteConfig
} from "../../../lib/types";
import { pathToFileURL } from "url";

let configuredRoutes: Routes | null = null;

const getConfiguredRoutes = async () => {
  if (configuredRoutes === null) {
    // NOTE: To Match the path used in prepare stage
    const routesJsonPath = join(
      __dirname,
      PATH_HTTP_SCHEMAS,
      FILE_ROUTES_HTTP_JSON
    );
    if (!existsSync(routesJsonPath)) {
      throw new Error("Found no routes at " + routesJsonPath);
    }
    const routesStr = await readFile(routesJsonPath, { encoding: "utf8" });
    const routes = JSON.parse(routesStr);
    if (typeof routes !== "object") {
      throw new Error("Invalid routes configuration in " + routesJsonPath);
    }
    configuredRoutes = routes;
  }
  return configuredRoutes as Routes;
};

const validators: Record<string, ValidateFunction> = {};

const loadValidator = async (
  path: string,
  method: string,
  key: "body" | { name: string; in: "path" | "query" | "header" }
) => {
  const validatorPath = getHttpSchemaPath(path, method, key);
  if (validators[validatorPath] === undefined) {
    try {
      validators[validatorPath] = (
        await import(
          pathToFileURL(
            join(__dirname, PATH_HTTP_SCHEMAS, validatorPath)
          ).toString()
        )
      ).default;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error in loading validator", e);
      // @ts-expect-error this is okay to assign the default validate function here
      validators[validatorPath] = () => {
        return true;
      };
    }
  }
  return validators[validatorPath];
};

const getMethodAndPath = (event: Event) => {
  const [method, path] = event.routeKey.split(" ");
  return { path, method };
};

const getRouteConfig = async (
  path: string,
  method: string
): Promise<RouteConfig> => {
  const configuredRoutes = await getConfiguredRoutes();
  const routeConfig = configuredRoutes[path]?.[method];
  if (routeConfig === undefined) {
    throw new NoRouteFoundError(`No route defined for ${method} ${path}`);
  }
  return routeConfig;
};

const validateParameter = async (
  path: string,
  method: string,
  name: string,
  _in: "path" | "query" | "header",
  value: string | undefined,
  required: boolean
) => {
  if (required && value === undefined) {
    throw new Error(`Parameter ${name} must be present in ${_in}`);
  }
  if (value !== undefined) {
    const validator = await loadValidator(path, method, { name, in: _in });
    const violations = await validate(validator, value);
    if (violations.length > 0) {
      throw new BadRequestError(
        JSON.stringify({
          message: `Invalid Parameter ${name} in ${_in}`,
          errors: violations
        })
      );
    }
  }
  return value;
};

const validateParameters = async (
  path: string,
  method: string,
  routeConfig: RouteConfig,
  event: Event
): Promise<Request["parameters"]> => {
  const validatedParameters: Request["parameters"] = {
    path: {},
    query: {},
    header: {}
  };

  if (routeConfig.parameters) {
    await Promise.all(
      routeConfig.parameters.map(async parameter => {
        let value: string | undefined = undefined;
        if (parameter.in == "path") {
          value = event.pathParameters?.[parameter.name];
        } else if (parameter.in == "query") {
          value = event.queryStringParameters?.[parameter.name];
        } else if (parameter.in == "header") {
          value = event.headers[parameter.name];
        }
        validatedParameters[parameter.in][parameter.name] =
          await validateParameter(
            path,
            method,
            parameter.name,
            parameter.in,
            value,
            parameter.required
          );
      })
    );
  }
  return validatedParameters;
};

const parseBody = (routeConfig: RouteConfig, event: Event) => {
  let contentType = routeConfig.body?.parser;
  if (contentType === undefined) {
    if (event.headers["content-type"]?.includes("application/json")) {
      contentType = "json";
    } else if (
      event.headers["content-type"]?.includes(
        "application/x-www-form-urlencoded"
      )
    ) {
      contentType = "formdata";
    } else {
      contentType = "text";
    }
  }

  let parsedBody: string | Record<string, unknown> = event.body || "";

  if (contentType == "json") {
    parsedBody = JSON.parse(parsedBody);
  } else if (contentType == "formdata") {
    parsedBody = decode(parsedBody);
  }

  return parsedBody;
};

const validateBody = async (
  path: string,
  method: string,
  routeConfig: RouteConfig,
  event: Event
) => {
  let validatedBody: unknown = undefined;
  if (routeConfig.body) {
    const validator = await loadValidator(path, method, "body");
    const parsedBody = parseBody(routeConfig, event);
    const violations = await validate(validator, parsedBody);
    if (violations.length > 0) {
      throw new BadRequestError(
        JSON.stringify({
          message: `Invalid Request Body`,
          errors: violations
        })
      );
    }
    validatedBody = parsedBody;
  }
  return validatedBody;
};

const middleware: Middleware<Event, Result> = async (next, event) => {
  try {
    const { method, path } = getMethodAndPath(event);

    const routeConfig = await getRouteConfig(path, method);

    const validatedParameters = await validateParameters(
      path,
      method,
      routeConfig,
      event
    );
    const validatedBody = await validateBody(path, method, routeConfig, event);

    const somodHttpRequest: Request = {
      route: path,
      method: method,
      parameters: validatedParameters,
      body: validatedBody
    };

    event.somodMiddlewareContext.set(MIDDLEWARE_CONTEXT_KEY, somodHttpRequest);

    return await next();
  } catch (e) {
    if (e instanceof NoRouteFoundError) {
      return {
        statusCode: 404,
        body: e.message
      };
    } else if (e instanceof BadRequestError) {
      return {
        statusCode: 400,
        body: e.message
      };
    } else {
      // eslint-disable-next-line no-console
      console.error(e.message);
      return {
        statusCode: 500
      };
    }
  }
};

export default middleware;
