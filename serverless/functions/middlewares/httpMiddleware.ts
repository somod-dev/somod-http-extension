/* eslint-disable no-console */
// serverless/functions/middlewares/myMiddleware.ts

import { EventWithMiddlewareContext, Middleware } from "somod";
import {
  Copy,
  EventType,
  LAYERS_BASE_PATH,
  RouteOptions,
  Routes
} from "../../../lib/types";
import { encodeFileSystem } from "../../../lib/utils";

const myMiddleware: Middleware<Copy<EventType>> = async (next, event) => {
  let routeOptions = {} as RouteOptions;
  try {
    console.log("inside myMiddleware");
    routeOptions = await getRoute(event.routeKey);
    console.log("routeOptions");
    console.log(routeOptions);
  } catch (error) {
    /**
     * TODO: log error here
     */
    console.log("Error getRoute myMiddleware");
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
    console.log("Error validateParameters myMiddleware");
    console.log(error);
    return {
      statusCode: 400,
      body: error.message
    };
  }

  event.somodMiddlewareContext.set("somod-http-extension", {
    testing: "sample meddleware context testing"
  });

  let result: unknown = null;
  // try {
  result = await next();
  //   console.log("result is ");
  //   console.log(result);
  // } catch (error) {
  //   return {
  //     statusCode: 404,
  //     body: error.message
  //   };
  // }

  return result;
};

const getRoute = async (routeKey: string): Promise<RouteOptions> => {
  const routesFilePath = "/opt/routes.js";
  // eslint-disable-next-line import/no-unresolved
  const _obj = await import(routesFilePath);
  const routes = _obj.routes as Routes;
  console.log("routes");
  console.log(routes);
  if (!routes || routes[routeKey] == undefined) {
    throw new Error("path did not match");
  }

  return routes[routeKey];
};

const validateParameters = async (
  event: EventWithMiddlewareContext<Copy<EventType>>,
  routeOptions: RouteOptions
): Promise<void> => {
  console.log("inside validateParameters");
  await Promise.all(
    routeOptions.schemas.map(async key => {
      console.log(key);
      const validateFilePath = encodeFileSystem(event.routeKey, key);
      const path = LAYERS_BASE_PATH + validateFilePath;
      console.log("Path is ");
      console.log(path);
      // eslint-disable-next-line prefer-const
      let validate = await import(path);
      console.log("import passed");
      console.log(validate);
      const _obj = getEventPropertyByKey(event, key);
      console.log(_obj);
      // eslint-disable-next-line prefer-const
      let valid = validate.default;
      const isValid = valid(_obj);
      console.log(isValid);
      if (!isValid) {
        console.log("hey error in validator - ");
        console.log(valid);
        console.log(valid.errors);
        throw new Error(validate.errors);
      }
    })
  );
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
