/* eslint-disable no-console */
import { join } from "path";
import { Middleware } from "somod";
import {
  Copy,
  EventType,
  HttpMethod,
  InputType,
  KeyOptions,
  ParserType,
  Request,
  RoutesTransformed
} from "../../../lib/types";
import { encodeFileSystem } from "../../../lib/utils";

const ROUTES_FILE = "routes.js";
const LAYERS_BASE_PATH = "/opt/somod-http-extension";

const httpMiddleware: Middleware<Copy<EventType>> = async (next, event) => {
  let keyOptions = {} as KeyOptions;
  /**
   * TODO: add route here
   * TODO: add schema file location in yaml file
   * TODO: create schema file in build folder for writing routes
   */
  const request = {
    method: event.requestContext.http.method
  } as Request;
  try {
    console.log("inside myMiddleware");

    // eslint-disable-next-line import/no-unresolved
    const _obj = await import(join(LAYERS_BASE_PATH, ROUTES_FILE));
    const routes = _obj.routes as RoutesTransformed;
    /**
     * TODO: check if we need to use toLocaleLowerCase()
     */
    keyOptions = (routes[event.routeKey] as KeyOptions) ?? {};
    if (!routes) {
      return {
        statusCode: 404,
        body: "request url doesnot match routes configuration"
      };
    }

    if (keyOptions.headers?.schema) {
      validate(event.headers, event.routeKey, InputType.headers);
    }

    if (keyOptions.pathParameters?.schema) {
      validate(event.pathParameters, event.routeKey, InputType.pathParameters);
    }

    if (keyOptions.queryStringParameters?.schema) {
      validate(
        event.queryStringParameters,
        event.routeKey,
        InputType.queryStringParameters
      );
    }

    if (event.body) {
      request.body = await parseBody(
        event.body,
        keyOptions.body,
        event.requestContext.http.method
      );
    }

    if (keyOptions.body?.schema) {
      await validate(event.body, event.routeKey, InputType.body);
    }
  } catch (error) {
    console.log("Error getting the given route myMiddleware");
    return {
      statusCode: 404,
      body: error.message
    };
  }

  event.somodMiddlewareContext.set("somod-http-extension", {
    body: request.body,
    headers: event.headers,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters
  });

  const result = await next();

  return result;
};

const parseBody = async (
  body: string,
  bodyOptions: KeyOptions[InputType.body],
  method: string
) => {
  try {
    if (
      bodyOptions?.parser !== ParserType.text &&
      (bodyOptions?.parser == ParserType.json ||
        method == HttpMethod.POST ||
        method == HttpMethod.PUT ||
        method == HttpMethod.DELETE ||
        method == HttpMethod.PATCH)
    ) {
      body = JSON.parse(body);
    }
  } catch (error) {
    throw new Error("Error while parsing request body " + error.message);
  }
};

const validate = async (data: unknown, routeKey: string, key: string) => {
  const validateFilePath = encodeFileSystem(routeKey, key);
  const path = LAYERS_BASE_PATH + validateFilePath;

  // eslint-disable-next-line prefer-const
  let validate = await import(path);
  const isValid = validate.default(data);
  if (!isValid) {
    throw new Error(
      validate.default.errors.instancePath +
        " : " +
        validate.default.errors.message
    );
  }
};

export default httpMiddleware;
