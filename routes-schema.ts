import { JSONSchema7 } from "json-schema";

export const schema: JSONSchema7 = {
  type: "object",
  patternProperties: {
    "^[ A-Za-z0-9_@./#&+-]*$": {
      type: "object",
      minProperties: 1,
      additionalProperties: false,
      patternProperties: {
        "^(GET|POST|PUT|DELETE|HEAD)$": {
          additionalProperties: false,
          type: "object",
          properties: {
            headers: {
              type: "object",
              minProperties: 1,
              additionalProperties: false,
              properties: {
                schema: { $ref: "http://json-schema.org/draft-07/schema" }
              }
            },
            pathParameters: {
              type: "object",
              minProperties: 1,
              additionalProperties: false,
              properties: {
                schema: { $ref: "http://json-schema.org/draft-07/schema" }
              }
            },
            queryStringParameters: {
              type: "object",
              minProperties: 1,
              additionalProperties: false,
              properties: {
                schema: { $ref: "http://json-schema.org/draft-07/schema" }
              }
            },
            body: {
              type: "object",
              minProperties: 1,
              additionalProperties: false,
              properties: {
                parser: { enum: ["string", "object"] },
                schema: { $ref: "http://json-schema.org/draft-07/schema" }
              }
            }
          }
        }
      }
    }
  }
};
