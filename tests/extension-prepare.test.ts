/* eslint-disable no-console */
import { mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import { createFiles, createTempDir } from "nodejs-file-utils";
import { join } from "path";
import {
  IContext,
  IModuleHandler,
  IServerlessTemplateHandler,
  Module,
  ModuleNode
} from "somod";
import {
  BUILD,
  FUNCTIONS,
  FUNCTION_LAYERS,
  HTTP_JSON,
  SERVERLESS,
  SOMOD,
  SOMOD_HTTP_EXTENSION,
  prepare
} from "../extension";
import {
  getTestContext,
  getTestModule,
  getTestModuleNode,
  getTestRootModule
} from "./test-util";

const TESTS = "tests";
const TEST_DATA = "test-data";
export const ROOT_MODULE_NAME = "root-module";

describe("Test Hooks - build and prebuild", () => {
  let dir = "";
  const cwd = process.cwd();
  beforeEach(() => {
    dir = createTempDir("somod-http-extension-test");
    console.log(dir);
  });
  afterEach(() => {
    // deleteDir(dir);
  });

  test("prepare no template yaml file", async () => {
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

    if (!prepare) {
      fail("prepare hook dosenot exists");
    }

    await expect(prepare(context)).resolves.toBeUndefined();
  });

  test("prepare no functions in template yaml", async () => {
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

  test("prepare - negative test", async () => {
    const rootModule: Module = getTestRootModule(dir);
    const _moduleNode: ModuleNode = getTestModuleNode(rootModule);
    const _moduleAName = "moduleA";
    const _moduleBName = "@test/moduleB";
    const _moduleAPath = join(dir, "node_modules", "module-a");
    const _moduleBPath = join(dir, "node_modules", "@private/module-b");
    const _moduleAFnPath = join(_moduleAPath, BUILD, SERVERLESS, FUNCTIONS);
    const _moduleBFnPath = join(_moduleBPath, BUILD, SERVERLESS, FUNCTIONS);

    const moduleA: Module = getTestModule(_moduleAPath, _moduleAName);
    const moduleB: Module = getTestModule(_moduleBPath, _moduleBName);
    await mkdir(_moduleAFnPath, {
      recursive: true
    });

    await mkdir(_moduleBFnPath, {
      recursive: true
    });

    createFiles(_moduleAFnPath, {
      ["fnA" + HTTP_JSON]: (await readFile(
        join(cwd, TESTS, TEST_DATA, "valid-routes.json")
      )) as unknown as string
    });

    createFiles(_moduleBFnPath, {
      ["fnB" + HTTP_JSON]: (await readFile(
        join(cwd, TESTS, TEST_DATA, "valid-routes.json")
      )) as unknown as string
    });

    const moduleHandler: IModuleHandler = {
      roodModuleName: rootModule.name,
      getModule: (name: string) => {
        let _mNode = {} as ModuleNode;
        switch (name) {
          case ROOT_MODULE_NAME:
            _mNode = _moduleNode;
            break;
          case _moduleAName:
            _mNode = getTestModuleNode(moduleA);
            break;
          case _moduleBName:
            _mNode = getTestModuleNode(moduleB);
            break;
        }
        return _mNode;
      },
      list: [_moduleNode]
    };

    const sth = {
      getSAMResourceLogicalId(moduleName, somodResourceId) {
        return moduleName + somodResourceId;
      }
    } as IServerlessTemplateHandler;
    const context: IContext = getTestContext(moduleHandler, sth);

    const templateBefore = (await readFile(
      join(cwd, TESTS, TEST_DATA, "template.yaml")
    )) as unknown as string;

    createFiles(rootModule.packageLocation, {
      "template.yaml": templateBefore
    });

    if (!prepare) {
      fail("prepare hook dosenot exists");
    }

    await expect(prepare(context)).resolves.toBeUndefined();

    let template = await readFile(
      join(cwd, TESTS, TEST_DATA, "template-after-prepare.yaml"),
      { encoding: "utf8" }
    );
    template = template.replace(/\${dirPath}/g, dir);
    template = template.replace(/\${sq}/g, "'");

    const templateCreated = await readFile(join(dir, "template.yaml"), {
      encoding: "utf8"
    });

    const _fnL = join(dir, SOMOD, SERVERLESS, FUNCTION_LAYERS);
    const _pathRouteA = join(
      _fnL,
      _moduleAName,
      SOMOD_HTTP_EXTENSION + "fnA",
      SOMOD_HTTP_EXTENSION,
      "routes.js"
    );
    const _pathSchemaA = join(
      _fnL,
      _moduleAName,
      SOMOD_HTTP_EXTENSION + "fnA",
      SOMOD_HTTP_EXTENSION,
      "GET__user__userId_body.js"
    );
    const _pathRouteB = join(
      _fnL,
      _moduleAName,
      SOMOD_HTTP_EXTENSION + "fnB",
      SOMOD_HTTP_EXTENSION,
      "routes.js"
    );
    const _pathSchemaB = join(
      _fnL,
      _moduleAName,
      SOMOD_HTTP_EXTENSION + "fnB",
      SOMOD_HTTP_EXTENSION,
      "GET__user__userId_body.js"
    );
    expect(template).toEqual(templateCreated);
    expect(existsSync(_pathRouteA)).toEqual(true);
    expect(true).toEqual(existsSync(_pathSchemaA));
    expect(true).toEqual(existsSync(_pathRouteB));
    expect(true).toEqual(existsSync(_pathSchemaB));
  });
});
