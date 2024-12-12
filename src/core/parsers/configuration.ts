import { cosmiconfig } from "cosmiconfig";
import { MODULE_NAME } from "../constants";

// ...
const explorer = cosmiconfig(MODULE_NAME);

export class ConfigurationParser {
  public async parse() {
    console.log("Parsing configuration...");
    try {
      const result = await explorer.search();

      if (typeof result?.config !== "object") {
        // todo: better error handling
        throw new Error("No configuration found");
      }

      return result.config;
      // todo: validate config schema (zod?)
      // todo: create and return ToolConfiguration object from config
    } catch (e) {
      // todo: handle error
    }
  }
}
