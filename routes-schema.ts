import { JSONSchema7 } from "json-schema";

export const schema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  patternProperties: {
    "^[ A-Za-z0-9_@./#&+-]*$": {
      type: "object",
      required: ["method"],
      additionalProperties: false,
      properties: {
        method: { type: "string" },
        schemas: {
          type: "object",
          additionalProperties: false,
          properties: {
            header: {
              $ref: "http://json-schema.org/draft-07/schema",
            },
            body: {
              $ref: "http://json-schema.org/draft-07/schema",
            },
          },
        },
      },
    },
  },
};
