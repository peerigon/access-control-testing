import Oas from "oas";
import OASNormalize from "oas-normalize";
import { HttpMethods, OASDocument } from "oas/dist/types";
import {
  AuthenticatorType,
  AuthParameterLocationDescription,
} from "../authentication/http/types";
import { getOpenApiField, OpenApiFieldNames } from "../constants";

type SpecificationPath = ConstructorParameters<typeof OASNormalize>[0];

export class OpenAPIParser {
  private constructor(private readonly openApiSource: Oas) {} // private specificationPath: ConstructorParameters<typeof OASNormalize>[0],

  /**
   * Parses the OpenAPI specification and returns a new instance of the OpenAPIParser.
   * Implemented as a factory method to allow for async initialization.
   * @param specificationPath The path to the OpenAPI specification
   */
  public static async create(specificationPath: string) {
    const openApiSource = await OpenAPIParser.getOasSource(specificationPath);

    return new OpenAPIParser(openApiSource);
  }

  /**
   * Parses the OpenAPI specification and returns the Oas object to work with later
   * @private
   */
  private static async getOasSource(
    specificationPath: SpecificationPath,
  ): Promise<Oas> {
    const jsonSpecification =
      await OpenAPIParser.parseOpenAPI(specificationPath);

    return new Oas(jsonSpecification as OASDocument); // todo: fix type
  }

  private static async parseOpenAPI(specificationPath: SpecificationPath) {
    const oas = new OASNormalize(specificationPath);

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

  public getPaths() {
    const oasPaths = this.openApiSource.getPaths();

    return this.transformPathsSchema(oasPaths);
  }

  /**
   * Returns all available paths enriched with resource information for each parameter representing a resource identifier
   */
  // todo: either add skip flag to individual paths or just leave out all the login endpoints
  public getUrlsWithParameterInfo() {
    const paths = this.getPaths();

    return paths.map((path) => {
      const { parameters } = path.schema;

      const resources = parameters?.map((parameter) => ({
        parameterName: parameter.name,
        parameterLocation: parameter.in,
        resourceName: getOpenApiField(
          parameter,
          OpenApiFieldNames.RESOURCE_NAME,
        ),
        resourceAccess: getOpenApiField(
          parameter,
          OpenApiFieldNames.RESOURCE_ACCESS,
        ),
      }));

      return {
        url: path.path, // todo: prepend base url for full-formed URL -> maybe return URL object instead of string?
        resources,
      };
    });
  }

  /**
   * Transforms the paths schema from Oas to a minimal schema containing only the necessary information
   */
  private transformPathsSchema(oasPaths: ReturnType<Oas["getPaths"]>) {
    return Object.values(oasPaths).flatMap((oasPath) => Object.values(oasPath));
  }

  // todo: move return type to another file
  public getAuthEndpoint(
    securitySchemeIdentifier: string,
    authenticatorType: AuthenticatorType,
  ): {
    authEndpoint: ReturnType<OpenAPIParser["getPaths"]>[0];
    authRequestParameterDescription: {
      username: AuthParameterLocationDescription;
      password: AuthParameterLocationDescription;
    };
    authResponseParameterDescription: AuthParameterLocationDescription;
  } {
    // todo: validate that securityScheme is only one of the supported ones
    // if not, throw an error or skip

    const paths = this.getPaths();

    // todo: handle cases when 0 or more than 1 is found
    // maybe 0 or more than 1 are cases to be handled by validation / parsing
    // for now, just return the first path that matches
    const authEndpoint = paths.find((path) => {
      // todo: add type
      const authEndpointSecuritySchemeIdentifier = getOpenApiField(
        path.schema,
        OpenApiFieldNames.AUTH_ENDPOINT,
      );

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
          const authFieldType = getOpenApiField(
            property,
            OpenApiFieldNames.AUTH_FIELD,
          )?.type;

          if (authFieldType === "username") {
            usernameDescription = {
              parameterName: propertyKey,
              parameterLocation, // todo: fix type
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

      const authRequestParameterDescription = {
        username: usernameDescription,
        password: passwordDescription,
      };

      if (authenticatorType === AuthenticatorType.HTTP_BEARER) {
        return {
          authEndpoint,
          authRequestParameterDescription,
          authResponseParameterDescription:
            this.getTokenParameterDescription(authEndpoint),
        };
      }

      if (authenticatorType === AuthenticatorType.API_KEY_COOKIE) {
        return {
          authEndpoint,
          authRequestParameterDescription,
          authResponseParameterDescription: {
            parameterName: "adonis-session", // todo: get this from the OpenAPI spec
            parameterLocation: "cookie",
          },
        };
      }

      throw new Error("Authenticator type not supported");
    } else {
      // todo: add proper error handling
      throw new Error("Auth endpoint not found");
    }
  }

  // todo: move out filtering part to a separate function (to be reused for username/password extract function)
  private getTokenParameterDescription(
    authEndpoint: ReturnType<OpenAPIParser["getPaths"]>[0],
  ): AuthParameterLocationDescription {
    const responseStatusCodes = authEndpoint.getResponseStatusCodes();

    // console.log(responseStatusCodes, "responseStatusCodes");

    // todo: create a separate method for this
    for (let responseStatusCode of responseStatusCodes) {
      const [response] =
        authEndpoint.getResponseAsJSONSchema(responseStatusCode);

      for (const propertyKey in response.schema.properties) {
        const property = response.schema.properties[propertyKey];

        if (
          getOpenApiField(property, OpenApiFieldNames.AUTH_FIELD)?.type ===
          "token"
        ) {
          console.debug("token", propertyKey);
          // todo: what about nested parameter locations?
          return {
            parameterName: propertyKey,
            parameterLocation: "body", // todo: add type
          };
        }
      }
    }

    // todo: add proper error handling
    throw new Error("Token not found in the response body");
  }

  // todo: stricter types
  // todo: what if there are 0 security schemes?
  public getSecurityScheme(url: string, httpMethod: string) {
    // todo: figure out what happens to parametrized routes
    const operation = this.openApiSource.getOperation(
      url,
      httpMethod as HttpMethods,
    );

    if (!operation) {
      // todo: add proper error handling
      throw new Error("Operation not found");
    }

    //const securityScheme = operation.getSecurity();
    const securitySchemeCombinations = operation.getSecurityWithTypes();

    console.debug("securitySchemeCombinations", securitySchemeCombinations);

    // todo: figure out if there should be another logic to choose the appropriate security scheme
    // for now, just use the first combination of security schemes available
    const [firstSecuritySchemeCombination] = securitySchemeCombinations;

    // todo: assert that securityScheme has length 1
    // there is an AND condition for all security schemes in the array securityScheme
    // for now, this is not supported and should throw an error / should be skipped
    if (!firstSecuritySchemeCombination || !firstSecuritySchemeCombination[0]) {
      throw new Error("Security scheme not found");
    }

    return firstSecuritySchemeCombination[0].security;
  }

  public getAuthenticatorTypeBySecurityScheme(
    securityScheme: ReturnType<OpenAPIParser["getSecurityScheme"]>,
  ): AuthenticatorType {
    const type = securityScheme.type.toLowerCase();
    const scheme = securityScheme.scheme?.toLowerCase();
    const location = securityScheme.in?.toLowerCase();

    if (type === "http") {
      if (scheme === "bearer") {
        return AuthenticatorType.HTTP_BEARER;
      } else if (scheme === "basic") {
        return AuthenticatorType.HTTP_BASIC;
      }
    }

    if (type === "apikey" && location === "cookie") {
      return AuthenticatorType.API_KEY_COOKIE;
    }

    return AuthenticatorType.NONE;
  }
}
