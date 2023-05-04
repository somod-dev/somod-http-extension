import { APIGatewayProxyEventPathParameters } from "aws-lambda";
import { EventType } from "./types";

/**
 *
 * TODO:check the logic of below function
 */
export const encodeFileSystem = (
  path: string,
  method: string,
  type: string
) => {
  return path.replace(/\//g, "#") + method + type + ".js";
};

export const parsePathParams = (
  event: EventType
): APIGatewayProxyEventPathParameters => {
  return event.pathParameters ?? {};
};
