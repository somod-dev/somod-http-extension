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
import {
  BUILD,
  FUNCTIONS,
  SERVERLESS,
  TEMPLATE_YAML,
  build,
  prebuild,
  prepare
} from "../extension";
import {
  getTestContext,
  getTestModule,
  getTestRootModule,
  getTestModuleNode
} from "./test-util";

const TESTS = "tests";
const TEST_DATA = "test-data";

describe("Test Hooks - build and prebuild", () => {
  let dir = "";
  const cwd = process.cwd();
  beforeEach(() => {
    dir = createTempDir("somod-http-extension-test");
  });
  afterEach(() => {
    // deleteDir(dir);
  });

  test("prebuild no template yaml file", async () => {
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

    // createFiles(rootModule.packageLocation, {
    //   [TEMPLATE_YAML]: "sample content"
    // });

    if (!prepare) {
      fail("prebuild hood dosenot exists");
    }

    await expect(prepare(context)).resolves.toBeUndefined();
  });

  test("prebuild no functions in template yaml", async () => {
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

    const templateBefore = (await readFile(
      join(cwd, TESTS, TEST_DATA, "template-no-functions.yaml")
    )) as unknown as string;

    createFiles(rootModule.packageLocation, {
      "template-no-functions.yaml": templateBefore
    });

    if (!prepare) {
      fail("prebuild hood dosenot exists");
    }

    await expect(prepare(context)).resolves.toBeUndefined();

    const templateAfter = (await readFile(
      join(cwd, TESTS, TEST_DATA, "template-no-functions.yaml")
    )) as unknown as string;

    expect(templateAfter).toEqual(templateBefore);
  });

  test("prebuild - negative test", async () => {
    const rootModule: Module = getTestRootModule(dir);
    const _moduleNode: ModuleNode = getTestModuleNode(rootModule);
    const _modulleABasePath = join(dir, "node_modules", "module-a");
    const _modulleTestABasePath = join(dir, "node_modules", "@test/module-a");
    const moduleA: Module = getTestModule(_modulleABasePath, "module-a");
    const testModuleA: Module = getTestModule(
      _modulleTestABasePath,
      "@test/module-a"
    );
    await mkdir(join(_modulleABasePath, BUILD, SERVERLESS, FUNCTIONS), {
      recursive: true
    });

    await mkdir(join(_modulleTestABasePath, BUILD, SERVERLESS, FUNCTIONS), {
      recursive: true
    });

    const moduleHandler: IModuleHandler = {
      roodModuleName: rootModule.name,
      getModule: (name: string) => {
        let _mNode = {} as ModuleNode;
        switch (name) {
          case "module-a":
            _mNode = getTestModuleNode(moduleA);
            break;
          case "@test/module-a":
            _mNode = getTestModuleNode(testModuleA);
            break;
        }
        return _mNode;
      },
      list: [_moduleNode]
    };

    const context: IContext = getTestContext(moduleHandler);

    const templateBefore = (await readFile(
      join(cwd, TESTS, TEST_DATA, "template.yaml")
    )) as unknown as string;

    createFiles(rootModule.packageLocation, {
      [moduleA.name]: templateBefore,
      [testModuleA.name]: templateBefore
    });

    if (!prepare) {
      fail("prebuild hook dosenot exists");
    }

    await expect(prepare(context)).resolves.toBeUndefined();

    const templateAfter = (await readFile(
      join(cwd, TESTS, TEST_DATA, "template-no-functions.yaml")
    )) as unknown as string;

    expect(templateAfter).toEqual(templateBefore);
  });
});
