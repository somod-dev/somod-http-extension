/* eslint-disable no-console */
import { mkdir, readFile } from "fs/promises";
import { createFiles, createTempDir, listFiles } from "nodejs-file-utils";
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
import { BUILD, FUNCTIONS, SERVERLESS, build, prebuild } from "../extension";
import {
  getTestContext,
  getTestModuleNode,
  getTestRootModule
} from "./test-util";

const TESTS = "tests";
const TEST_DATA = "test-data";

describe("Test Hooks - build and prebuild", () => {
  let dir = "";
  const cwd = process.cwd();
  beforeEach(() => {
    dir = createTempDir("test-somod-http-extension");
  });
  afterEach(() => {
    // deleteDir(dir);
  });

  test("prebuild - valid routes", async () => {
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

    await expect(prebuild(context)).resolves.toBeUndefined();
  });

  test("prebuild - invalid parameter schema", async () => {
    const function1 = join(SERVERLESS, FUNCTIONS, "function-one.ts");
    const function2 = join(SERVERLESS, FUNCTIONS, "function-two.ts");
    const function3 = join(SERVERLESS, FUNCTIONS, "function-three.ts");
    const yaml1 = join(SERVERLESS, FUNCTIONS, "function-one.http.yaml");
    const yaml1Content = (await readFile(
      join(cwd, TESTS, TEST_DATA, "routes-invalid-schema.yaml")
    )) as unknown as string;

    createFiles(dir, {
      [function1]: "sample content",
      [function2]: "",
      [function3]: "",
      [yaml1]: yaml1Content
    });

    const rootModule: Module = getTestRootModule(dir);
    const _moduleNode: ModuleNode = getTestModuleNode(rootModule);
    const moduleHandler: IModuleHandler = {
      roodModuleName: rootModule.name,
      getModule: () => {
        return _moduleNode;
      },
      list: [_moduleNode]
    };
    const context: IContext = getTestContext(moduleHandler);

    if (!prebuild) {
      fail("prebuild hood dosenot exists");
    }
    const errorMessage =
      "~1user~1{userId}.GET.body.schema.type : must be equal to one of the allowed values" +
      "\n" +
      "~1user~1{userId}.GET.body.schema.type : must be array";

    // await expect(prebuild(context)).resolves.toBeUndefined();
    await expect(prebuild(context)).rejects.toThrowError(errorMessage);
  });

  test("prebuild - invalid routes ", async () => {
    const function1 = join(SERVERLESS, FUNCTIONS, "function-one.ts");
    const function3 = join(SERVERLESS, FUNCTIONS, "function-three.ts");
    const yaml3 = join(SERVERLESS, FUNCTIONS, "function-three.http.yaml");
    const yaml3Content = (await readFile(
      join(cwd, TESTS, TEST_DATA, "invalid-routes.yaml")
    )) as unknown as string;

    createFiles(dir, {
      [function1]: "sample content",
      [function3]: "",
      [yaml3]: yaml3Content
    });

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
    const errorMessage =
      "~1user~1{userId}.GET : must NOT have additional properties" +
      "\n" +
      "~1user~1{userId}.GET.body.schema : must be object,boolean";

    await expect(prebuild(context)).rejects.toThrowError(errorMessage);
  });

  test("build - files created inside build folder", async () => {
    const _fOne = "function-one";
    const _fThree = "function-three";
    const function1 = join(SERVERLESS, FUNCTIONS, _fOne + ".ts");
    const function3 = join(SERVERLESS, FUNCTIONS, _fThree + ".ts");
    const yaml1 = join(SERVERLESS, FUNCTIONS, _fOne + ".http.yaml");
    const yaml3 = join(SERVERLESS, FUNCTIONS, _fThree + ".http.yaml");

    createFiles(dir, {
      [function1]: "",
      [function3]: "",
      [yaml1]: `"/user/{userId}":
      "GET":`,
      [yaml3]: `"/user/{userId}":
      "GET":`
    });

    const rootModuleName = "root-module";
    const rootModule: Module = {
      name: rootModuleName,
      version: "1.0.0",
      packageLocation: dir,
      root: true
    };

    const moduleNode: ModuleNode = {
      module: rootModule,
      parents: [],
      children: []
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
    if (!build) {
      fail("prebuild hood dosenot exists");
    }
    const buildSchemaDir = join(dir, BUILD, SERVERLESS, FUNCTIONS);
    await mkdir(buildSchemaDir, { recursive: true });

    await build(context);

    console.log(buildSchemaDir);
    const fileNames = await listFiles(buildSchemaDir);
    console.log(fileNames);

    expect(true).toEqual(fileNames.includes(_fOne + ".http.json"));
    expect(true).toEqual(fileNames.includes(_fThree + ".http.json"));
  });
});
