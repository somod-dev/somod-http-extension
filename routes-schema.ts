import { JSONSchema7 } from "json-schema";

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
                parser: { enum: ["text", "json"] },
                schema: { $ref: "http://json-schema.org/draft-07/schema" }
              }
            }
          }
        }
      }
    }
  }
};
