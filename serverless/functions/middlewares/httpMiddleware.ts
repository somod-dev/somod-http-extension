/* eslint-disable no-console */
// serverless/functions/middlewares/myMiddleware.ts

import { EventWithMiddlewareContext, Middleware } from "somod";
import {
  Copy,
  EventType,
  KeyOptions,
  LAYERS_BASE_PATH,
  Options,
  RoutesTransformed
} from "../../../lib/types";
import { encodeFileSystem } from "../../../lib/utils";

const Routes_FILE_PATH = "/opt/routes.js";

const myMiddleware: Middleware<Copy<EventType>> = async (next, event) => {
  let keyOptions = {} as KeyOptions;
  try {
    console.log("inside myMiddleware");

    // eslint-disable-next-line import/no-unresolved
    const _obj = await import(Routes_FILE_PATH);
    const routes = _obj.routes as RoutesTransformed;
    keyOptions = routes[event.routeKey] as KeyOptions;
    if (!routes || !keyOptions) {
      return {
        statusCode: 404,
        body: "request url doesnot exists"
      };
    }
    console.log("keyOptions");
    console.log(keyOptions);
  } catch (error) {
    /**
     * TODO: log error here
     */
    console.log("Error getting the given route myMiddleware");
    return {
      statusCode: 404,
      body: "request url doesnot match routes configuration"
    };
  }

  try {
    await validateParameters(event, keyOptions);
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

  /**
   * TODO: for testing to be removed
   */
  event.somodMiddlewareContext.set("somod-http-extension", {
    testing: "sample meddleware context testing"
  });

  let result: unknown = null;
  result = await next();

  return result;
};

const validateParameters = async (
  event: EventWithMiddlewareContext<Copy<EventType>>,
  keyOptions: Options
): Promise<void> => {
  console.log("inside validateParameters");
  await Promise.all(
    Object.keys(keyOptions).map(async key => {
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
  try {
    key.split(".").forEach(_key => {
      _event = _event[_key];
    });
  } catch (error) {
    throw new Error(`given key - ${key} not found in event object `);
  }
  return _event;
};

export default myMiddleware;
