import { createFiles, createTempDir } from "nodejs-file-utils";
import { validate } from "../lib/utils";
// eslint-disable-next-line no-var
var dir = createTempDir("somod-http-extension-test");

import {
  APIGatewayEventRequestContextLambdaAuthorizer,
  APIGatewayEventRequestContextV2WithAuthorizer
} from "aws-lambda";
import { EventWithMiddlewareContext, IMiddlewareContext } from "somod";
import { ROUTES_FILE } from "../lib/constants";
import {
  AuthorizerContextType,
  Copy,
  EventType,
  GeneratedOptions,
  Request
} from "../lib/types";
import {
  getRouteOptions,
  parseAndValidate
} from "../serverless/functions/middlewares/httpMiddleware";
import { getEvent } from "./test-util";

jest.mock("../lib/utils");

describe("Test Hooks - prepare", () => {
  afterEach(() => {
    // deleteDir(dir);
  });

  test("httpMiddleware - parseAndValidate", async () => {
    // validate is mocked
    (
      validate as jest.MockedFunction<(...args: unknown[]) => unknown>
    ).mockImplementation(() => null);

    const _opts = {
      body: { schema: true, parser: "json" }
    } as GeneratedOptions;
    const event: EventWithMiddlewareContext<Copy<EventType>> = {
      version: "",
      routeKey: "PUT /user/{userId}",
      rawPath: "",
      rawQueryString: "",
      headers: {},
      requestContext: {
        http: {
          method: "GET"
        }
      } as APIGatewayEventRequestContextV2WithAuthorizer<
        APIGatewayEventRequestContextLambdaAuthorizer<AuthorizerContextType>
      >,
      isBase64Encoded: false,
      somodMiddlewareContext: {} as IMiddlewareContext,
      body: '{ "body": "I am sample body" }'
    };

    const request: Request = await parseAndValidate(event, dir, _opts);
    expect(request.method).toEqual("GET");
    expect(request.body).toEqual({ body: "I am sample body" });
  });

  test("httpMiddleware - parseAndValidate : negative test", async () => {
    // validate is mocked
    (
      validate as jest.MockedFunction<(...args: unknown[]) => unknown>
    ).mockImplementation(() => null);

    const _opts = {
      body: { schema: true, parser: "json" }
    } as GeneratedOptions;
    const event = getEvent(
      undefined,
      undefined,
      '{body:{"schema":true,"parser":"json"}}'
    );

    await expect(parseAndValidate(event, dir, _opts)).rejects.toThrowError(
      "Error while parsing request body : Unexpected token b in JSON at position 1"
    );
  });

  test("httpMiddleware - getRouteOptions : test", async () => {
    // validate is mocked
    (
      validate as jest.MockedFunction<(...args: unknown[]) => unknown>
    ).mockImplementation(() => null);

    createFiles(dir, {
      [ROUTES_FILE]:
        'exports.routes = {"PUT /user/{userId}":{"body":{"schema":true,"parser":"json"}}}'
    });

    const event = getEvent(
      undefined,
      undefined,
      '{body:{"schema":true,"parser":"json"}}'
    );

    const _opts = await getRouteOptions(event, dir, ROUTES_FILE);
    expect(_opts).toEqual({ body: { schema: true, parser: "json" } });
  });

  test("httpMiddleware - getRouteOptions : test", async () => {
    // validate is mocked
    (
      validate as jest.MockedFunction<(...args: unknown[]) => unknown>
    ).mockImplementation(() => null);

    createFiles(dir, {
      [ROUTES_FILE]:
        'exports.routes = {"PUT /user/{userId}":{"body":{"schema":true,"parser":"json"}}}'
    });

    const event = getEvent(
      undefined,
      undefined,
      '{body:{"schema":true,"parser":"json"}}'
    );

    await expect(getRouteOptions(event, dir, "test.js")).rejects.toThrowError(
      "Internal Server Error"
    );
  });
});
