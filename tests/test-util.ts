import {
  IContext,
  IExtensionHandler,
  IModuleHandler,
  INamespaceHandler,
  IServerlessTemplateHandler,
  Module,
  ModuleNode
} from "somod";

export const getTestRootModule = (path: string) => {
  const rootModule: Module = {
    name: "root-module",
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

export const getTestContext = (moduleHandler: IModuleHandler): IContext => {
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
    serverlessTemplateHandler: {} as IServerlessTemplateHandler
  };
};
