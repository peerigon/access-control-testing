import Oas from "oas";
import OASNormalize from "oas-normalize";
import { OASDocument } from "oas/dist/types";

export class OpenAPIParser {
  private openApiSource: Oas | undefined = undefined;

  constructor(
    private specificationPath: ConstructorParameters<typeof OASNormalize>[0],
  ) {}

  private async parseOpenAPI() {
    const oas = new OASNormalize(this.specificationPath);

    try {
      return await oas.validate();
    } catch (e) {
      // todo: add proper error handling
      console.error(e);
    }
  }

  /**
   * Parses the OpenAPI specification and returns the Oas object to work with later
   * @private
   */
  private async getOasSource(): Promise<Oas> {
    if (this.openApiSource === undefined) {
      const jsonSpecification = await this.parseOpenAPI();
      this.openApiSource = new Oas(jsonSpecification as OASDocument); // todo: fix type
    }

    return this.openApiSource;
  }

  // todo: return custom type
  async getPaths() {
    const oas = await this.getOasSource();
    return oas.getPaths();
  }
}
