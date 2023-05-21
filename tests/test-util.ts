import {
  IContext,
  IExtensionHandler,
  IModuleHandler,
  INamespaceHandler,
  IServerlessTemplateHandler,
  Module,
  ModuleNode
} from "somod";
import { ROOT_MODULE_NAME } from "./extension-prepare.test";

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
