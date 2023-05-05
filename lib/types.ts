import {
  APIGatewayProxyEventHeaders,
  APIGatewayProxyEventPathParameters,
  APIGatewayProxyEventQueryStringParameters,
  APIGatewayProxyEventV2WithLambdaAuthorizer
} from "aws-lambda";
import { JSONSchema7 } from "json-schema";

export type AuthorizerContextType = Record<string, unknown>;
export type Copy<T> = { [K in keyof T]: T[K] };

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
  "pathParameters" = "pathParameters",
  "queryStringParameters" = "queryStringParameters"
}

export type ParserType = Record<string, (event: EventType) => unknown>;

export type HttpRequest<TBody = Record<string, unknown>> = {
  [ParameterTypes.header]?: APIGatewayProxyEventHeaders;
  [ParameterTypes.pathParameters]?: APIGatewayProxyEventPathParameters;
  [ParameterTypes.queryStringParameters]?: APIGatewayProxyEventQueryStringParameters;
  [ParameterTypes.body]?: TBody;
};

export type HttpResponse = {
  statusCode: number;
  body?: string;
  headers?: Record<string, string>;
};

export type DefaultAdditionalParametersType = Record<string, unknown>;
export type DefaultBodyType = Record<string, unknown>;

export type LambdaFunctionType<
  TBody = DefaultBodyType,
  TAdditionalParams = DefaultAdditionalParametersType
> = (
  request: HttpRequest<TBody>,
  additionalParams?: TAdditionalParams
) => Promise<string | Record<string, unknown> | void>;

export const LAYERS_BASE_PATH = "/opt/routes/";
export const MODULE_NAME = "somod-http-extension";
