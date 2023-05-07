/* eslint-disable no-console */
// serverless/functions/middlewares/myMiddleware.ts

import { EventWithMiddlewareContext, Middleware } from "somod";
import {
  Copy,
  EventType,
  LAYERS_BASE_PATH,
  RouteOptions,
  Routes
} from "../../lib/types";
import { encodeFileSystem } from "../../lib/utils";

const myMiddleware: Middleware<Copy<EventType>> = async (next, event) => {
  let routeOptions = {} as RouteOptions;
  try {
    routeOptions = await getRoute(event.routeKey);
  } catch (error) {
    /**
     * TODO: log error here
     */
    return {
      statusCode: 404,
      body: "request url doesnot exists"
    };
  }

  try {
    await validateParameters(event, routeOptions);
  } catch (error) {
    /**
     * TODO: do we need to log error here
     */
    return {
      statusCode: 404,
      body: error.message
    };
  }

  // event.somodMiddlewareContext.set("somod-http-extension");

  const result = await next();

  // post processing

  return result;
};

const getRoute = async (routeKey: string): Promise<RouteOptions> => {
  const routesFilePath = "/opt/routes.js";
  // eslint-disable-next-line import/no-unresolved
  const routes: Routes = await import(routesFilePath);

  if (!routes || routes[routeKey] == undefined) {
    throw new Error("path did not match");
  }

  return routes[routeKey];
};

const validateParameters = async (
  event: EventWithMiddlewareContext<Copy<EventType>>,
  routeOptions: RouteOptions
): Promise<void> => {
  Object.keys(routeOptions.schemas).map(async key => {
    const validateFilePath = encodeFileSystem(event.routeKey, key);
    const validate = await import(LAYERS_BASE_PATH + validateFilePath);
    const validateObj = getEventPropertyByKey(event, key);
    if (!validate(validateObj)) {
      throw new Error(validate.errors);
    }
  });
};

const getEventPropertyByKey = (
  event: EventWithMiddlewareContext<Copy<EventType>>,
  key: string
) => {
  /**
   * check if this should be deep copy, because event is readonly
   */
  let _event = event;
  key.split(".").forEach(_key => {
    _event = _event[_key];
  });
  return _event;
};

export default myMiddleware;
