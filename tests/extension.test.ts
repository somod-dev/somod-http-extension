import {
  IContext,
  IExtensionHandler,
  IModuleHandler,
  INamespaceHandler,
  IServerlessTemplateHandler,
  Module,
  ModuleNode
} from "somod";

describe("Test cli-open telemetry", () => {
  beforeAll(() => {
    /**
     * create a temp drive
     *  create node_modules/moduleA/build/serverless/functions/function-one.ts & function-one.http.yaml
     *
     */
  });

  test("test for command with error", async () => {
    console.log(process.cwd());
    const module: Module = {
      name: "module-a",
      version: "1.0.0",
      packageLocation: "sdfs",
      root: true
    };
    const _moduleNode: ModuleNode = {
      module: module,
      parents: [{}] as ModuleNode[],
      children: [{}] as ModuleNode[]
    };
    const moduleNode: ModuleNode = {
      module: module,
      parents: [_moduleNode],
      children: [_moduleNode]
    };
    const moduleHandler: IModuleHandler = {
      roodModuleName: "",
      getModule: () => {
        return moduleNode;
      },
      list: [moduleNode]
    };

    const context: IContext = {
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
    console.log(context);
    // await prebuild();
  });
});
