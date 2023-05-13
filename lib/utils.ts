import { APIGatewayProxyEventPathParameters } from "aws-lambda";
import { EventType } from "./types";

/**
 *
 * TODO:check the logic of below function
 */
export const encodeFileSystem = (routeKey: string, key: string) => {
  return routeKey.replace(/[/$ {}]/g, "_") + key + ".js";
};

export const parsePathParams = (
  event: EventType
): APIGatewayProxyEventPathParameters => {
  return event.pathParameters ?? {};
};
