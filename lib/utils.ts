export const getHttpSchemaPath = (
  path: string,
  method: string,
  key: "body" | { name: string; in: "path" | "query" | "header" }
) => {
  let schemaKey = path + ":" + method;
  if (key == "body") {
    schemaKey += ":body";
  } else {
    schemaKey += ":param:" + key.in + ":" + key.name;
  }

  return Buffer.from(schemaKey, "utf8").toString("base64url") + ".js";
};
