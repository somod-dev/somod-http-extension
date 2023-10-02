import { existsSync } from "fs";
import { readdir, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { Extension } from "somod";
import { PATH_BUILD, PATH_FUNCTIONS, PATH_SERVERLESS } from "./constants";
import { readYamlFileStore } from "nodejs-file-utils";

export const build: Extension["build"] = async context => {
  const functionsDir = join(context.dir, PATH_SERVERLESS, PATH_FUNCTIONS);
  if (!existsSync(functionsDir)) {
    // don't do anything if functionsDir does not exist
    return;
  }
  const httpYamlFiles = (await readdir(functionsDir)).filter(f =>
    f.endsWith(".http.yaml")
  );

  const functionsBuildDir = join(
    context.dir,
    PATH_BUILD,
    PATH_SERVERLESS,
    PATH_FUNCTIONS
  );

  await mkdir(functionsBuildDir, { recursive: true });
  for (const httpYamlFile in httpYamlFiles) {
    const content = await readYamlFileStore(join(functionsDir, httpYamlFile));
    await writeFile(
      join(
        functionsBuildDir,
        httpYamlFile.substring(0, httpYamlFile.length - ".yaml".length) +
          ".json"
      ),
      JSON.stringify(content)
    );
  }
};
