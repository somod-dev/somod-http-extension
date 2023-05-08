import { JSONSchema7 } from "json-schema";

export const schema: JSONSchema7 = {
  type: "object",
  patternProperties: {
    "^[ A-Za-z0-9_@./#&+-]*$": {
      type: "object",
      additionalProperties: false,
      properties: {
        schemas: {
          type: "object",
          properties: {
            header: {
              $ref: "http://json-schema.org/draft-07/schema"
            },
            body: {
              $ref: "http://json-schema.org/draft-07/schema"
            }
          }
        }
      }
    }
  }
};
