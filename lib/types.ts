import {
  APIGatewayProxyEventHeaders,
  APIGatewayProxyEventPathParameters,
  APIGatewayProxyEventQueryStringParameters,
  APIGatewayProxyEventV2WithLambdaAuthorizer
} from "aws-lambda";
import { JSONSchema7 } from "json-schema";

export type AuthorizerContextType = Record<string, unknown>;
export type EventType =
  APIGatewayProxyEventV2WithLambdaAuthorizer<AuthorizerContextType>;

export type RoutesConfig = Record<string, RouteConfigOptions>;
export type Routes = Record<string, RouteOptions>;

export type RouteConfigOptions = {
  method: string;
  schemas: {
    headers: JSONSchema7;
    body: JSONSchema7;
    pathParameters: JSONSchema7;
    queryStringParameters: JSONSchema7;
  };
};

export type RouteOptions = {
  method: string;
  schemas: {
    headers: boolean;
    body: boolean;
    pathParameters: boolean;
    queryStringParameters: boolean;
  };
};

export enum ParameterTypes {
  "header" = "header",
  "body" = "body",
  "pathParameters" = "pathParameters"
}

export type ParserType = Record<string, (event: EventType) => unknown>;

export type HttpRequest = {
  [ParameterTypes.header]?: APIGatewayProxyEventHeaders;
  pathParams?: APIGatewayProxyEventPathParameters;
  queryStringParameters?: APIGatewayProxyEventQueryStringParameters;
  [ParameterTypes.body]?: Record<string, unknown>;
};

export const LAYERS_BASE_PATH = "/opt/routes/";
