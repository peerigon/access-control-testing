import Oas from "oas";
import OASNormalize from "oas-normalize";
import { OASDocument } from "oas/dist/types";
import { OpenApiFields } from "../constants";
import {
  AuthenticationScheme,
  AuthenticationType,
  OpenApiPaths,
} from "../types";

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

      // todo: validate / parse x-act-auth-endpoint etc.
      // should be object and contain required properties
      // & is expected to be in at least one path when auth has been defined
    } catch (e) {
      // todo: add proper error handling
      throw new Error("OpenApi validation error");
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

  public async getAuthEndpoint(
    authenticationType: AuthenticationType,
    authenticationScheme: AuthenticationScheme,
  ) {
    const paths = await this.getPaths();

    // todo: handle cases when 0 or more than 1 is found
    // maybe 0 or more than 1 are cases to be handled by validation / parsing
    // for now, just return the first path that matches
    return paths.find((path) => {
      const authEndpointInfo = path.schema[OpenApiFields.AUTH_ENDPOINT];

      return (
        authEndpointInfo?.type === authenticationType &&
        authEndpointInfo?.scheme === authenticationScheme
      );
    });
  }
}
