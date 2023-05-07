import { EventWithMiddlewareContext } from "somod";
import {
  Copy,
  CustomEventType,
  HttpResponse,
  LambdaFunctionType
} from "./types";

export class HttpLambda {
  private apis: Record<string, LambdaFunctionType> = {};

  register = <TBody = Record<string, unknown>>(
    routeKey: string,
    lambdaFn: LambdaFunctionType<TBody>
  ) => {
    /**
     * as LambdaFunctionType is just hack to get types mapped properly
     */
    this.apis[routeKey] = lambdaFn as LambdaFunctionType;
  };

  getHandler = () => {
    return async (
      event: EventWithMiddlewareContext<Copy<CustomEventType>>
    ): Promise<HttpResponse> => {
      const lambdaFn = this.apis[event.routeKey.toLocaleLowerCase()];
      if (lambdaFn == undefined) {
        throw new Error("404, url dose not exists");
      }

      const result = await lambdaFn(event);
      return this.lambdaResponseHandler(result);
    };
  };

  lambdaResponseHandler = (
    result: string | void | Record<string, unknown>
  ): HttpResponse => {
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
