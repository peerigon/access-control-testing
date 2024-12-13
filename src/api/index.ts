import { ConfigurationParser } from "../core/parsers/configuration";
import { OpenAPIParser } from "../core/parsers/openapi";

export class Act {
  public async scan() {
    console.log("Scanning...");

    const configurationParser = new ConfigurationParser();
    // todo: url and other properties will come from an object in the future
    const { openApiUrl } = await configurationParser.parse();

    const openAPIParser = new OpenAPIParser(openApiUrl);
    const paths = await openAPIParser.getPaths();
  }
}
