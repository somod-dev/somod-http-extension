import { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
import { JSONSchema7 } from "json-schema";
import { EventWithMiddlewareContext } from "somod";

export type AuthorizerContextType = Record<string, unknown>;
export type Copy<T> = { [K in keyof T]: T[K] };

export type EventType =
  APIGatewayProxyEventV2WithLambdaAuthorizer<AuthorizerContextType>;

export type CustomEventType<TBody = Record<any, unknown>> =
  APIGatewayProxyEventV2WithLambdaAuthorizer<AuthorizerContextType> & {
    body: TBody;
  };

export type RoutesConfig = Record<string, RouteConfigOptions>;
export type Routes = Record<string, RouteOptions>;

export type RouteConfigOptions = {
  schemas: Record<string, JSONSchema7>;
};

export type RouteOptions = {
  schemas: string[];
};

export enum ParameterTypes {
  "header" = "header",
  "body" = "body",
  "pathParameters" = "pathParameters",
  "queryStringParameters" = "queryStringParameters"
}

export type ParserType = Record<string, (event: EventType) => unknown>;

export type HttpResponse = {
  statusCode: number;
  body?: string;
  headers?: Record<string, string>;
};

export type DefaultAdditionalParametersType = Record<string, unknown>;
export type DefaultBodyType = Record<string, unknown>;

export type LambdaFunctionType<TBody = Record<any, unknown>> = (
  event: EventWithMiddlewareContext<Copy<CustomEventType<TBody>>>
) => Promise<string | Record<string, unknown> | void>;

export const LAYERS_BASE_PATH = "/opt/";
export const MODULE_NAME = "somod-http-extension";
