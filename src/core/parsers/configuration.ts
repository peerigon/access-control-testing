import { cosmiconfig } from "cosmiconfig";
import { TOOL_NAME } from "../constants";
import { ConfigurationSchema } from "../schemas";
import { Configuration } from "../types";

const explorer = cosmiconfig(TOOL_NAME);

export class ConfigurationParser {
  public async parse(): Promise<Configuration> {
    console.log("Parsing configuration...");
    try {
      const configSearchResult = await explorer.search();

      if (typeof configSearchResult?.config !== "object") {
        // todo: better error handling
        throw new Error("No configuration found");
      }

      const { config } = configSearchResult;
      return this.parseSchema(config);
    } catch (e) {
      // todo: improve error message / error handling
      // todo: read missing or invalid prop from Zod error and show it in the error message
      throw new Error("Error while parsing tool configuration: " + e);
    }
  }

  private parseSchema(config: object): Configuration {
    return ConfigurationSchema.parse(config);
  }
}
