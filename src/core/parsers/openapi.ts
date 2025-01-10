import Oas from "oas";
import OASNormalize from "oas-normalize";
import { OASDocument } from "oas/dist/types";
import { AuthParameterLocationDescription } from "../authentication/http/types";
import { OpenApiFields } from "../constants";

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

  public async getPaths() {
    const oas = await this.getOasSource();
    const oasPaths = oas.getPaths();

    return this.transformPathsSchema(oasPaths);
  }

  /**
   * Transforms the paths schema from Oas to a minimal schema containing only the necessary information
   */
  private transformPathsSchema(oasPaths: ReturnType<Oas["getPaths"]>) {
    return Object.values(oasPaths).flatMap((oasPath) => Object.values(oasPath));
  }

  public async getAuthEndpoint(securitySchemeIdentifier: string) {
    const paths = await this.getPaths();

    // todo: handle cases when 0 or more than 1 is found
    // maybe 0 or more than 1 are cases to be handled by validation / parsing
    // for now, just return the first path that matches
    const authEndpoint = paths.find((path) => {
      // todo: add type
      const authEndpointSecuritySchemeIdentifier =
        path.schema[OpenApiFields.AUTH_ENDPOINT];

      return authEndpointSecuritySchemeIdentifier === securitySchemeIdentifier;
    });

    if (authEndpoint) {
      // todo: accept other formats of auth endpoint, when username/password is not part of the json request body
      // const requestBody = authEndpoint.getRequestBody("application/json");
      const parameters = authEndpoint.getParametersAsJSONSchema();

      let usernameDescription: AuthParameterLocationDescription | null = null;
      let passwordDescription: AuthParameterLocationDescription | null = null;

      for (const parameter of parameters) {
        const { type: parameterLocation } = parameter;
        for (const propertyKey in parameter.schema.properties) {
          const property = parameter.schema.properties[propertyKey];

          // type can only be username or password
          // this should be validated before, then we can safely assume that the type is either username or password
          const authFieldType = property[OpenApiFields.AUTH_FIELD]?.type;

          if (authFieldType === "username") {
            usernameDescription = {
              parameterName: propertyKey,
              parameterLocation,
            };
          }

          if (authFieldType === "password") {
            passwordDescription = {
              parameterName: propertyKey,
              parameterLocation,
            };
          }
        }

        if (usernameDescription && passwordDescription) {
          break;
        }
      }

      if (!usernameDescription || !passwordDescription) {
        // todo: add proper error handling
        throw new Error("Username or password not found in the request body");
      }

      let tokenParameterLocationDescription: AuthParameterLocationDescription | null =
        null;

      const responseStatusCodes = authEndpoint.getResponseStatusCodes();

      // console.log(responseStatusCodes, "responseStatusCodes");

      // todo: create a separate method for this
      for (let responseStatusCode of responseStatusCodes) {
        const [response] =
          authEndpoint.getResponseAsJSONSchema(responseStatusCode);

        for (const propertyKey in response.schema.properties) {
          const property = response.schema.properties[propertyKey];

          if (property[OpenApiFields.AUTH_FIELD]?.type === "token") {
            console.log("token", propertyKey);
            // todo: what about nested parameter locations?
            tokenParameterLocationDescription = {
              parameterName: propertyKey,
              parameterLocation: "responseBody", // todo: add type
            };
            // todo: break the loop
          }
        }
      }

      if (!tokenParameterLocationDescription) {
        // todo: add proper error handling
        throw new Error("Token not found in the response body");
      }

      const authParameterLocationDescription = {
        username: usernameDescription,
        password: passwordDescription,
      };

      return {
        authEndpoint,
        authParameterLocationDescription,
        tokenParameterLocationDescription,
      };
    } else {
      // todo: add proper error handling
      throw new Error("Auth endpoint not found");
    }
  }
}
