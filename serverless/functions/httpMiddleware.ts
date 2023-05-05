/* eslint-disable no-console */
// serverless/functions/middlewares/myMiddleware.ts

import { Middleware } from "somod";
import {
  Copy,
  EventType,
  HttpRequest,
  LAYERS_BASE_PATH,
  ParameterTypes,
  ParserType,
  RouteOptions,
  Routes
} from "../../lib/types";
import { encodeFileSystem, parsePathParams } from "../../lib/utils";

const myMiddleware: Middleware<Copy<EventType>> = async (next, event) => {
  let route = {} as RouteOptions;
  try {
    route = await getRoute(
      event.requestContext.http.method,
      event.requestContext.http.path
    );
  } catch (error) {
    /**
     * TODO: log error here
     */
    return {
      statusCode: 404,
      body: "request url doesnot exists"
    };
  }

  const httpRequest: HttpRequest = parseRequest(event, getParsers());

  try {
    await validateParameters(
      httpRequest,
      event.requestContext.http.path,
      route
    );
  } catch (error) {
    /**
     * TODO: log error here
     */
    return {
      statusCode: 404,
      body: error.message
    };
  }

  event.somodMiddlewareContext.set("somod-http-extension", httpRequest);

  const result = await next();

  // post processing

  return result;
};

const getRoute = async (
  method: string,
  path: string
): Promise<RouteOptions> => {
  const routesFilePath = "/opt/routes.js";
  // eslint-disable-next-line import/no-unresolved
  const routes: Routes = await import(routesFilePath);

  if (routes[path] == undefined || routes[path].method !== method) {
    throw new Error("path did not match");
  }

  return routes[path];
};

const getParsers = (): ParserType => {
  const parsers: ParserType = {};
  parsers[ParameterTypes.pathParameters] = parsePathParams;
  return parsers;
};

const parseRequest = (event: EventType, parsers: ParserType) => {
  const parsedValues = Object.keys(parsers).map(type => {
    const params = parsers[type](event);
    return { type: params };
  });

  return parsedValues as HttpRequest;
};

const validateParameters = async (
  httpRequest: HttpRequest,
  path: string,
  route: RouteOptions
): Promise<void> => {
  Object.keys(route.schemas).map(async type => {
    if (route.schemas[type]) {
      const validateFilePath = encodeFileSystem(path, route.method, type);
      const validate = await import(LAYERS_BASE_PATH + validateFilePath);

      if (!validate(httpRequest[type])) {
        throw new Error(validate.errors);
      }
    }
  });
};

export default myMiddleware;
