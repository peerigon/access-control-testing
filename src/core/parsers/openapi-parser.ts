import Oas from "oas";
import OASNormalize from "oas-normalize";
import type {
  HttpMethods,
  KeyedSecuritySchemeObject,
  OASDocument,
} from "oas/types";
import { parseTemplate } from "url-template";
import {
  AuthenticatorType,
  AuthParameterLocationDescription,
} from "../authentication/http/types.ts";
import { getOpenApiField, OpenApiFieldNames } from "../constants.ts";
import { ResourceIdentifier } from "../policy/types.js";
import { AuthEndpointInformation } from "../types.js";

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
  public getPathResourceMappings(filterAuthEndpointsOut: boolean = true) {
    // todo: ensure that validation happens before
    // parameterName, parameterLocation, resourceAccess resourceName need to be valid
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
        path: path.path,
        method: path.method,
        isAuthEndpoint: Boolean(
          getOpenApiField(path.schema, OpenApiFieldNames.AUTH_ENDPOINT),
        ),
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
  /**
   * Returns the auth endpoint for the given security scheme identifier or null if the authenticator type does not have an auth endpoint
   * @param securityScheme
   * @param authenticatorType
   */
  public getAuthEndpoint(
    securityScheme: KeyedSecuritySchemeObject,
    authenticatorType: AuthenticatorType,
  ): AuthEndpointInformation | null {
    // todo: validate that securityScheme is only one of the supported ones
    // if not, throw an error or skip

    const securitySchemeIdentifier = securityScheme._key;

    if (
      authenticatorType !== AuthenticatorType.HTTP_BEARER &&
      authenticatorType !== AuthenticatorType.API_KEY_COOKIE
    ) {
      return null;
    }

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
        const authResponseParameterDescription = {
          parameterName: securityScheme.name,
          parameterLocation: securityScheme.in,
        };

        // todo: check if parameterLocation is of type ParameterLocation
        if (
          !authResponseParameterDescription.parameterName ||
          !authResponseParameterDescription.parameterLocation
        ) {
          throw new Error(
            "Could not find parameter name (name) or parameter location (in) for Cookie Authentication",
          );
        }

        return {
          authEndpoint,
          authRequestParameterDescription,
          authResponseParameterDescription,
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
  public getSecurityScheme(
    url: string,
    httpMethod: string,
  ): KeyedSecuritySchemeObject | null {
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
    // todo: maybe set true for filterInvalid?
    const securitySchemeCombinations = operation.getSecurityWithTypes();

    console.debug("securitySchemeCombinations", securitySchemeCombinations);

    // todo: figure out if there should be another logic to choose the appropriate security scheme
    // for now, just use the first combination of security schemes available
    const [firstSecuritySchemeCombination] = securitySchemeCombinations;

    // todo: assert that securityScheme has length 1
    // there is an AND condition for all security schemes in the array securityScheme
    // for now, this is not supported and should throw an error / should be skipped
    if (!firstSecuritySchemeCombination || !firstSecuritySchemeCombination[0]) {
      // no security scheme found, this is expected for public routes
      // no distinction possible between explicit security: [] and no security definition
      // todo: warning when no global security: [] is defined and no distinction is possible

      // todo: login routes should not be interpreted as non-public (and therefore require authentication)
      return null;
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

  /**
   * Expands a URL template with the given parameters
   * @param urlTemplateString The URL template as string to expand
   * @param parameters The parameters to expand the URL template with
   * @returns The expanded path or URL as string
   */
  public static expandUrlTemplate(
    urlTemplateString: string,
    parameters: Record<string | number | symbol, ResourceIdentifier | unknown>,
  ): string {
    const urlTemplate = parseTemplate(urlTemplateString);

    return urlTemplate.expand(parameters);
  }

  public static constructFullUrl(
    url: string,
    baseUrl: string = "http://localhost:3333/",
  ) {
    return new URL(url, baseUrl);
  }
}
