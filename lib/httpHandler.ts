import { EventWithMiddlewareContext } from "somod";
import {
  Copy,
  DefaultAdditionalParametersType,
  EventType,
  HttpRequest,
  HttpResponse,
  LambdaFunctionType,
  MODULE_NAME
} from "./types";

export class HttpLambda {
  private apis: Record<
    string,
    {
      lambdaFn: LambdaFunctionType;
      additionalParams?: Record<string, string>;
    }
  > = {};

  register = <
    TBody = Record<string, unknown>,
    TAdditionalParams = Record<string, unknown>
  >(
    path: string,
    mehtod: string,
    lambdaFn: LambdaFunctionType<TBody, TAdditionalParams>,
    additionalParams?: Record<string, string>
  ) => {
    this.apis[path.toLocaleLowerCase() + " " + mehtod.toLocaleLowerCase()] = {
      lambdaFn: lambdaFn as LambdaFunctionType,
      additionalParams: additionalParams
    };
  };

  getAdditionalParams = (
    event: EventWithMiddlewareContext<Copy<EventType>>,
    additionalParams: Record<string, string>
  ): DefaultAdditionalParametersType => {
    //if empty object return whole event object
    if (Object.keys(additionalParams).length == 0) {
      return event as DefaultAdditionalParametersType;
    }

    const params = {} as DefaultAdditionalParametersType;
    Object.keys(additionalParams).forEach(key => {
      let _event = event;
      additionalParams[key].split(".").forEach(property => {
        _event = _event[property];
      });
      params[key] = _event;
    });

    return params;
  };

  getHandler = () => {
    return async (
      event: EventWithMiddlewareContext<Copy<EventType>>
    ): Promise<HttpResponse> => {
      const api = this.apis[event.routeKey.toLocaleLowerCase()];
      if (api.lambdaFn == undefined) {
        throw new Error("404, url dose not exists");
      }

      const httpRquest = event.somodMiddlewareContext.get(
        MODULE_NAME
      ) as HttpRequest;

      let additionalParams = {} as DefaultAdditionalParametersType;
      if (api.additionalParams) {
        additionalParams = this.getAdditionalParams(
          event,
          api.additionalParams
        );
      }

      const result = await api.lambdaFn(httpRquest, additionalParams);
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

// const handler = new HttpLambda();

// const lambda: LambdaFunctionType<string> = async (
//   request: HttpRequest<string>
// ) => {
//   // eslint-disable-next-line no-console
//   console.log(request);
// };

// const lambda1: LambdaFunctionType<string, string> = async (
//   request: HttpRequest<string>,
//   additionalParams: string | undefined
// ) => {
//   // eslint-disable-next-line no-console
//   console.log(request + (additionalParams ?? ""));
// };

// const lambda3: LambdaFunctionType<{ a: "" }, { b: "" }> = async (
//   request,
//   additionalParams
// ) => {
//   // eslint-disable-next-line no-console
//   console.log((request.body?.a ?? "") + (additionalParams?.b ?? ""));
// };

// handler.register("sdf", "sds", lambda, { "": "" });
// handler.register("sdf", "sds", lambda1, { "": "" });
// handler.register("sdf", "sds", lambda3, { "": "" });
