import { JSONSchema7 } from "json-schema";

export type Routes = Record<
  string,
  Record<
    string,
    {
      parameters?: [
        {
          in: "path" | "query" | "header";
          name: string;
          schema: JSONSchema7;
          required: boolean;
        }
      ];
      body?: {
        parser?: "text" | "json" | "formdata";
        schema: JSONSchema7;
      };
    }
  >
>;

export const schema: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema",
  $id: "https://somod-http-extension.sodev.com/routes-schema.json",
  title: "JSON Schema for rotues configuration",
  type: "object",
  additionalProperties: false,
  patternProperties: {
    "^.*$": {
      type: "object",
      minProperties: 1,
      additionalProperties: false,
      patternProperties: {
        "^(GET|HEAD|POST|PUT|DELETE|CONNECT|OPTIONS|TRACE|PATCH)$": {
          type: "object",
          properties: {
            parameters: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["in", "name", "schema", "required"],
                properties: {
                  in: { enum: ["path", "query", "header"] },
                  name: {
                    type: "string",
                    pattern: "^[a-zA-Z0-9_-]+$"
                  },
                  schema: {
                    $ref: "http://json-schema.org/draft-07/schema"
                  },
                  required: {
                    type: "boolean"
                  }
                }
              }
            },
            body: {
              type: "object",
              required: ["schema"],
              properties: {
                parser: { enum: ["text", "json", "formdata"] },
                schema: { $ref: "http://json-schema.org/draft-07/schema" }
              }
            }
          }
        }
      }
    }
  }
};
