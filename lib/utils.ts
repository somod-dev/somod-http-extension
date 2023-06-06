import { join } from "path";
/**
 *
 * TODO:check the logic of below function
 */
export const encodeFilePath = (routeKey: string, key: string) => {
  return routeKey.replace(/[/$ {}]/g, "_") + key + ".js";
};

export const validate = async (
  data: unknown,
  routeKey: string,
  key: string,
  basePath: string
) => {
  const validateFilePath = encodeFilePath(routeKey, key);

  // eslint-disable-next-line prefer-const
  let validate = await import(join(basePath, validateFilePath));
  const isValid = validate.default(data);
  if (!isValid) {
    throw new Error(
      validate.default.errors
        .map(v => v.instancePath + " : " + v.message)
        .join("\n")
    );
  }
};
