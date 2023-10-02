import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Routes } from "./routes-schema";

type Copy<T> = { [K in keyof T]: T[K] };
export type Event = Copy<APIGatewayProxyEventV2>;
export type Result = Copy<APIGatewayProxyResultV2>;

export type RouteConfig = Routes[string][string];

export type Request<
  BT = unknown,
  PT extends Record<string, unknown> = Record<string, unknown>,
  QT extends Record<string, unknown> = Record<string, unknown>,
  HT extends Record<string, unknown> = Record<string, unknown>
> = {
  route: string;
  method: string;
  parameters: {
    path: PT;
    query: QT;
    header: HT;
  };
  body: BT;
};

export class NoRouteFoundError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type RouteHandler<
  BT = unknown,
  PT extends Record<string, unknown> = Record<string, unknown>,
  QT extends Record<string, unknown> = Record<string, unknown>,
  HT extends Record<string, unknown> = Record<string, unknown>
> = (
  request: Request<BT, PT, QT, HT>,
  event: APIGatewayProxyEventV2
) => Promise<APIGatewayProxyResultV2>;
