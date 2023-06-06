import {
  EventWithMiddlewareContext,
  IContext,
  IExtensionHandler,
  IMiddlewareContext,
  IModuleHandler,
  INamespaceHandler,
  IServerlessTemplateHandler,
  Module,
  ModuleNode
} from "somod";
import { ROOT_MODULE_NAME } from "./extension-prepare.test";
import { AuthorizerContextType, Copy, EventType } from "../lib/types";
import {
  APIGatewayEventRequestContextLambdaAuthorizer,
  APIGatewayEventRequestContextV2WithAuthorizer
} from "aws-lambda";

export const getTestRootModule = (path: string) => {
  const rootModule: Module = {
    name: ROOT_MODULE_NAME,
    version: "1.0.0",
    packageLocation: path,
    root: true
  };
  return rootModule;
};

export const getTestModule = (path: string, name: string) => {
  const module: Module = {
    name: name,
    version: "1.0.0",
    packageLocation: path,
    root: false
  };
  return module;
};

export const getTestModuleNode = (module: Module) => {
  return {
    module: module,
    parents: [{}] as ModuleNode[],
    children: [{}] as ModuleNode[]
  };
};

export const getTestContext = (
  moduleHandler: IModuleHandler,
  sth?: IServerlessTemplateHandler
): IContext => {
  return {
    dir: process.cwd(),
    moduleHandler: moduleHandler,
    extensionHandler: {} as IExtensionHandler,
    getModuleHash: () => {
      return "";
    },
    isDebugMode: false,
    isServerless: true,
    isUI: false,
    namespaceHandler: {} as INamespaceHandler,
    serverlessTemplateHandler: sth ?? ({} as IServerlessTemplateHandler)
  };
};

export const getEvent = (routeKey?: string, method?: string, body?: string) => {
  const event: EventWithMiddlewareContext<Copy<EventType>> = {
    version: "",
    routeKey: routeKey ?? "PUT /user/{userId}",
    rawPath: "",
    rawQueryString: "",
    headers: {},
    requestContext: {
      http: {
        method: method ?? "PUT"
      }
    } as APIGatewayEventRequestContextV2WithAuthorizer<
      APIGatewayEventRequestContextLambdaAuthorizer<AuthorizerContextType>
    >,
    isBase64Encoded: false,
    somodMiddlewareContext: {} as IMiddlewareContext,
    body: body ?? '{ "body": "I am sample body" }'
  };
  return event;
};
