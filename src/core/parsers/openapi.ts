import Oas from "oas";
import OASNormalize from "oas-normalize";
import { OASDocument } from "oas/dist/types";
import { OpenApiPaths } from "../types";

export class OpenAPIParser {
  private openApiSource: Oas | undefined = undefined;

  constructor(
    private specificationPath: ConstructorParameters<typeof OASNormalize>[0],
  ) {}

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

  private async parseOpenAPI() {
    const oas = new OASNormalize(this.specificationPath);

    try {
      return await oas.validate();
    } catch (e) {
      // todo: add proper error handling
      console.error(e);
    }
  }

  // todo: return custom type
  public async getPaths(): Promise<OpenApiPaths> {
    const oas = await this.getOasSource();
    const oasPaths = oas.getPaths();

    return this.transformPathsSchema(oasPaths);
  }

  /**
   * Transforms the paths schema from Oas to a minimal schema containing only the necessary information
   */
  private transformPathsSchema(
    oasPaths: ReturnType<Oas["getPaths"]>,
  ): OpenApiPaths {
    return Object.values(oasPaths).flatMap((oasPath) =>
      Object.values(oasPath).map(({ path, method, schema }) => ({
        path,
        method,
        schema, // todo: validate custom properties inside of schema
      })),
    );
  }
}
