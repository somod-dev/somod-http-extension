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

export type Routes = Record<string, HttpMethodOptions>;
export type RoutesTransformed = Record<string, KeyOptions>;

export type HttpMethodOptions = Record<HttpMethod, KeyOptions>;

export type KeyOptions = {
  headers?: {
    schema: JSONSchema7;
  };
  pathParameters?: {
    schema: JSONSchema7;
  };
  queryStringParameters?: {
    schema: JSONSchema7;
  };
  body?: {
    //one of below is mandatory
    schema?: JSONSchema7;
    parseType?: ParserType;
  };
};

export enum HttpMethod {
  "GET" = "GET",
  "POST" = "POST",
  "PUT" = "PUT",
  "DELETE" = "DELETE",
  "HEAD" = "HEAD"
}

export const BODY = "body";

// export type Options = {
//   schema?: JSONSchema7 | boolean;
//   type?: ParserType;
// };

export enum ParserType {
  "string" = "string",
  "object" = "object"
}

export enum ParameterTypes {
  "header" = "header",
  "body" = "body",
  "pathParameters" = "pathParameters",
  "queryStringParameters" = "queryStringParameters"
}

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
