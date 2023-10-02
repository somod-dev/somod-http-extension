import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { EventWithMiddlewareContext } from "somod";
import { Event, Request, RouteHandler } from "./types";
import { MIDDLEWARE_CONTEXT_KEY } from "./constants";

export class RouteBuilder {
  private routes: Record<string, Record<string, RouteHandler>> = {};

  add<
    BT = unknown,
    PT extends Record<string, unknown> = Record<string, unknown>,
    QT extends Record<string, unknown> = Record<string, unknown>,
    HT extends Record<string, unknown> = Record<string, unknown>
  >(
    route: string,
    method: string,
    routeHandler: RouteHandler<BT, PT, QT, HT>
  ): RouteBuilder {
    if (this.routes[route] === undefined) {
      this.routes[route] = {};
    }
    this.routes[route][method] = routeHandler as RouteHandler;
    return this;
  }

  getHandler(): APIGatewayProxyHandlerV2 {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    return async event => {
      const request = (
        event as EventWithMiddlewareContext<Event>
      ).somodMiddlewareContext.get(MIDDLEWARE_CONTEXT_KEY) as Request;

      const handler = that.routes[request.route]?.[request.method];

      if (handler === undefined) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            message: `No route handler defined for ${request.method} ${request.route}`
          })
        };
      } else {
        return await handler(request, event);
      }
    };
  }
}
