import { EventWithMiddlewareContext } from "somod";
import { Copy, EventType, Request, Response, RouteHandlerType } from "./types";

export class RouteHandler {
  private apis: Record<string, RouteHandlerType> = {};

  add = (route: string, method: string, routeHandler: RouteHandlerType) => {
    this.apis[`${method} ${route}`] = routeHandler;
  };

  getHandler = () => {
    return async (
      event: EventWithMiddlewareContext<Copy<EventType>>
    ): Promise<Response> => {
      const routeHandler = this.apis[event.routeKey.toLocaleLowerCase()];
      if (routeHandler == undefined) {
        return {
          statusCode: 200,
          body: "404, url dose not exists"
        };
      }
      const request = event.somodMiddlewareContext.get(
        "somod-http-extension"
      ) as Request;
      const result = await routeHandler(request, event);
      return this.lambdaResponseHandler(result);
    };
  };

  lambdaResponseHandler = (
    result: string | void | Record<string, unknown>
  ): Response => {
    const headers = {};
    headers["content-type"] =
      result && typeof result == "object" ? "application/json" : "text/plain";

    return {
      statusCode: 200,
      body: result
        ? typeof result === "object"
          ? JSON.stringify(result)
          : result
        : "",
      headers: headers
    };
  };
}
