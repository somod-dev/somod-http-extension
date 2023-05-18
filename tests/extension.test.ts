/* eslint-disable no-console */
import { readFile } from "fs/promises";
import { createFiles, createTempDir } from "nodejs-file-utils";
import { join } from "path";
import {
  IContext,
  IExtensionHandler,
  IModuleHandler,
  INamespaceHandler,
  IServerlessTemplateHandler,
  Module,
  ModuleNode
} from "somod";
import { FUNCTIONS, SERVERLESS, prebuild } from "../extension";

const TESTS = "tests";
const TEST_DATA = "test-data";

describe("routes test", () => {
  let dir = "";
  const cwd = process.cwd();
  beforeAll(() => {
    dir = createTempDir("test-somod-http-extension");
    console.log(dir);
  });
  afterAll(() => {
    // deleteDir(dir);
  });

  test("test for command with error", async () => {
    const function1 = join(SERVERLESS, FUNCTIONS, "function-one.ts");
    const function2 = join(SERVERLESS, FUNCTIONS, "function-two.ts");
    const function3 = join(SERVERLESS, FUNCTIONS, "function-three.ts");
    const yaml1 = join(SERVERLESS, FUNCTIONS, "function-one.http.yaml");
    const yaml1Content = (await readFile(
      join(cwd, TESTS, TEST_DATA, "valid-routes.yaml")
    )) as unknown as string;

    createFiles(dir, {
      [function1]: "sample content",
      [function2]: "",
      [function3]: "",
      [yaml1]: yaml1Content
    });

    console.log(process.cwd());
    const rootModuleName = "root-module";
    const rootModule: Module = {
      name: rootModuleName,
      version: "1.0.0",
      packageLocation: dir,
      root: true
    };
    const _moduleNode: ModuleNode = {
      module: rootModule,
      parents: [{}] as ModuleNode[],
      children: [{}] as ModuleNode[]
    };
    const moduleNode: ModuleNode = {
      module: rootModule,
      parents: [_moduleNode],
      children: [_moduleNode]
    };
    const moduleHandler: IModuleHandler = {
      roodModuleName: rootModuleName,
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
    if (!prebuild) {
      fail("prebuild hood dosenot exists");
    }
    await prebuild(context);
    console.log(context);
  });
});
