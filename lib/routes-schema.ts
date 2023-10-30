import { JSONSchema7 } from "json-schema";
import routesSchema from "../schemas/http-routes.json";

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

export const schema = routesSchema as JSONSchema7;
