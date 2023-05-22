import { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
import { JSONSchema7 } from "json-schema";
import { EventWithMiddlewareContext } from "somod";

export type AuthorizerContextType = Record<string, unknown>;
export type Copy<T> = { [K in keyof T]: T[K] };

export type EventType =
  APIGatewayProxyEventV2WithLambdaAuthorizer<AuthorizerContextType>;

export type RequestEventType<TBody = unknown> =
  APIGatewayProxyEventV2WithLambdaAuthorizer<AuthorizerContextType> & {
    body: TBody;
  };

export type Routes = Record<string, HttpMethodOptions>;
export type RoutesTransformed = Record<string, KeyOptions>;

export type HttpMethodOptions = Record<HttpMethod, KeyOptions>;

export enum InputType {
  "headers" = "headers",
  "pathParameters" = "pathParameters",
  "queryStringParameters" = "queryStringParameters",
  "body" = "body"
}

export type KeyOptions = {
  [InputType.headers]?: {
    schema: JSONSchema7;
  };
  [InputType.pathParameters]?: {
    schema: JSONSchema7;
  };
  [InputType.queryStringParameters]?: {
    schema: JSONSchema7;
  };
  [InputType.body]?: {
    //one of below is mandatory
    schema?: JSONSchema7;
    parser?: ParserType;
  };
};

export enum HttpMethod {
  "GET" = "GET",
  "HEAD" = "HEAD",
  "POST" = "POST",
  "PUT" = "PUT",
  "DELETE" = "DELETE",
  "CONNECT" = "CONNECT",
  "OPTIONS" = "OPTIONS",
  "TRACE" = "TRACE",
  "PATCH" = "PATCH"
}

export const BODY = "body";

export enum ParserType {
  "text" = "text",
  "json" = "json"
}

export enum ParameterTypes {
  "header" = "header",
  "body" = "body",
  "pathParameters" = "pathParameters",
  "queryStringParameters" = "queryStringParameters"
}

export type Response = {
  statusCode: number;
  body?: string;
  headers?: Record<string, string>;
};

export type Request<T = unknown> = {
  route: string;
  method: string;
  pathParameters: Record<string, string>;
  queryStringParameters: Record<string, string>;
  headers: Record<string, string>;
  body: T;
};

export type DefaultAdditionalParametersType = Record<string, unknown>;
export type DefaultBodyType = Record<string, unknown>;

export type RouteHandlerType<T = unknown> = (
  request: Request<T>,
  event: EventWithMiddlewareContext<Copy<EventType>>
) => Promise<string | Record<string, unknown> | void>;

export type AwsServerlessFunctionType = {
  Type: string;
  Properties: {
    CodeUri: string;
    Layers: Record<string, string>[];
  };
};

export type Names = {
  functionName: string;
  moduleName: string;
};
