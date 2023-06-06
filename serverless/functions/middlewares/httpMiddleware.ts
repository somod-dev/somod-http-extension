import { join } from "path";
import { EventWithMiddlewareContext, Middleware } from "somod";
import {
  LAYERS_MODULE_BASE_PATH,
  ROUTES_FILE,
  SOMOD_HTTP_EXTENSION
} from "../../../lib/constants";
import {
  Copy,
  EventType,
  GeneratedOptions,
  HttpMethod,
  InputType,
  ParserType,
  Request,
  RoutesTransformed
} from "../../../lib/types";
import { validate } from "../../../lib/utils";

const httpMiddleware: Middleware<Copy<EventType>> = async (next, event) => {
  /**
   * TODO: add test case, define schema as josn directly and use it
   * TODO: add schema file location in yaml file
   * TODO: create schema file in build folder for writing routes
   */

  const _options = await getRouteOptions(
    event,
    LAYERS_MODULE_BASE_PATH,
    ROUTES_FILE
  );

  if (!_options) {
    return {
      statusCode: 404,
      body: "requested url not found in the given configuration"
    };
  }

  const request = await parseAndValidate(
    event,
    LAYERS_MODULE_BASE_PATH,
    _options
  );

  event.somodMiddlewareContext.set(SOMOD_HTTP_EXTENSION, {
    body: request?.body,
    headers: event.headers,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters
  });

  const result = await next();

  return result;
};

export const getRouteOptions = async (
  event: EventWithMiddlewareContext<Copy<EventType>>,
  basePath: string,
  routesFile: string
): Promise<GeneratedOptions> => {
  let _obj = { routes: {} };
  const _path = join(basePath, routesFile);
  try {
    // eslint-disable-next-line import/no-unresolved
    _obj = await import(_path);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `dynamic import error, file dose not exists : ${_path} , ${error.message}`
    );
    throw new Error("Internal Server Error");
  }

  const routes = _obj.routes as RoutesTransformed;
  return routes[event.routeKey];
};

export const parseAndValidate = async (
  event: EventWithMiddlewareContext<Copy<EventType>>,
  basePath: string,
  options: GeneratedOptions
): Promise<Request> => {
  const request = {
    method: event.requestContext.http.method
  } as Request;

  if (options.headers?.schema) {
    validate(event.headers, event.routeKey, InputType.headers, basePath);
  }

  if (options.pathParameters?.schema) {
    validate(
      event.pathParameters,
      event.routeKey,
      InputType.pathParameters,
      basePath
    );
  }

  if (options.queryStringParameters?.schema) {
    validate(
      event.queryStringParameters,
      event.routeKey,
      InputType.queryStringParameters,
      basePath
    );
  }

  /**
   * parse will not happen if body is empty
   */
  request.body = event.body
    ? await parseBody(
        event.body,
        options.body,
        event.requestContext.http.method
      )
    : undefined;

  if (options.body?.schema) {
    await validate(request.body, event.routeKey, InputType.body, basePath);
  }
  return request;
};

const parseBody = async (
  body: string,
  bodyOptions: GeneratedOptions[InputType.body],
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
    throw new Error("Error while parsing request body : " + error.message);
  }
  return body;
};

export default httpMiddleware;
