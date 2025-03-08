import { HTTPError } from "got";
import Oas from "oas";
import OASNormalize from "oas-normalize";
import type {
  HttpMethods,
  KeyedSecuritySchemeObject,
  OASDocument,
  SchemaObject,
} from "oas/types";
import { parseTemplate } from "url-template";
import { AuthenticationStore } from "../authentication/authentication-store.ts";
import { type RequestAuthenticator } from "../authentication/http/authenticator.ts";
import {
  AuthenticatorType,
  type AuthParameterLocationDescription,
  type ParameterLocation,
} from "../authentication/http/types.ts";
import { OpenApiFieldNames } from "../constants.ts";
import type { Resource } from "../policy/entities/resource.ts";
import { createResourceDescriptorSchema } from "../schemas.ts";
import { Route } from "../tests/test-utils.ts";
import type { AuthEndpointInformation } from "../types.ts";
import {
  getOpenApiField,
  isValidUrl,
  parseOpenApiAuthField,
} from "../utils.ts";

type SpecificationUrl = ConstructorParameters<typeof OASNormalize>[0];
type SecurityScheme = KeyedSecuritySchemeObject;

export class OpenAPIParser {
  private constructor(
    private readonly openApiSource: Oas,
    private readonly apiBaseUrl: string,
  ) {} // private specificationPath: ConstructorParameters<typeof OASNormalize>[0],

  /**
   * Parses the OpenAPI specification and returns a new instance of the
   * OpenAPIParser. Implemented as a factory method to allow for async
   * initialization.
   *
   * @param specificationUrl The url to the OpenAPI specification
   * @param apiBaseUrl The base URL of the API to be used for making requests
   */
  static async create(specificationUrl: string, apiBaseUrl: string) {
    // todo: create validation function for this
    if (!isValidUrl(specificationUrl)) {
      throw new Error(
        "Invalid specification URL provided: " + specificationUrl,
      );
    }

    if (!isValidUrl(apiBaseUrl)) {
      throw new Error("Invalid API base URL provided: " + apiBaseUrl);
    }

    const openApiSource = await OpenAPIParser.getOasSource(specificationUrl);

    const isApiBaseUrlContained = openApiSource.api.servers?.some((server) => {
      try {
        return new URL(server.url).origin === new URL(apiBaseUrl).origin;
      } catch {
        return false;
      }
    });

    // todo: what to do with templates?
    if (!isApiBaseUrlContained) {
      throw new Error(
        `The provided API base URL ${apiBaseUrl} is not existing in the specification.`,
      );
    }

    // todo: validate that apiBaseUrl is a valid URL
    // & validate that it is contained in openapi specification
    // & validate custom fields
    return new OpenAPIParser(openApiSource, apiBaseUrl);
  }

  // todo: should this be part of the creation process?
  validateCustomFields(resources: Array<Resource>) {
    const resourceNames = resources.map((resource) => resource.getName());
    const resourceDescriptorSchema =
      createResourceDescriptorSchema(resourceNames);

    this.getPaths().forEach((path) => {
      path.getParameters().forEach((parameter) => {
        const resourceAccess = getOpenApiField(
          parameter,
          OpenApiFieldNames.RESOURCE_ACCESS,
        );
        const resourceName = getOpenApiField(
          parameter,
          OpenApiFieldNames.RESOURCE_NAME,
        );

        const parameterSchema = parameter.schema as SchemaObject;
        const parameterDefaultProvided = Boolean(parameterSchema.default);
        const resourceDescriptionNeeded =
          Boolean(parameter.required) && !parameterDefaultProvided;
        // todo: use default parameter values in requests when they are provided for required params

        // validate that required parameters are annotated with resource name and resource access
        if (resourceDescriptionNeeded && (!resourceAccess || !resourceName)) {
          throw new Error(
            "To describe required resources in routes, both 'resourceName' and 'resourceAccess' must be defined at the same time.",
          );
        }

        // todo: better custom error message
        // create a ResourceDescriptorParser
        // it should accept path.schema/parameter.schema and provide a nicer error message
        resourceDescriptorSchema.parse({
          resourceName,
          resourceAccess,
        });
      });

      resourceDescriptorSchema.parse({
        resourceName: getOpenApiField(
          path.schema,
          OpenApiFieldNames.RESOURCE_NAME,
        ),
        resourceAccess: getOpenApiField(
          path.schema,
          OpenApiFieldNames.RESOURCE_ACCESS,
        ),
      });
    });
  }

  /**
   * Parses the OpenAPI specification and returns the Oas object to work with
   * later
   *
   * @private
   */
  private static async getOasSource(
    specificationUrl: SpecificationUrl,
  ): Promise<Oas> {
    const jsonSpecification =
      await OpenAPIParser.parseOpenAPI(specificationUrl);

    return new Oas(jsonSpecification as OASDocument); // todo: fix type
  }

  private static async parseOpenAPI(specificationUrl: SpecificationUrl) {
    const oas = new OASNormalize(specificationUrl);

    try {
      return await oas.validate();

      // todo: validate / parse x-act-auth-endpoint etc.
      // should be object and contain required properties
      // & is expected to be in at least one path when auth has been defined
    } catch (error: unknown) {
      if (error instanceof HTTPError && error.cause?.code === "ECONNREFUSED") {
        throw new Error(
          `Could not retrieve given OpenApi specification at ${specificationUrl}, connection to server got refused.`,
        );
      }

      // todo: add proper error handling
      throw new Error(
        `The server at ${specificationUrl} did not return a valid OpenAPI specification.`,
      );
    }
  }

  getPaths() {
    const oasPaths = this.openApiSource.getPaths();

    return this.transformPathsSchema(oasPaths);
  }

  /**
   * Returns all available paths enriched with resource information for each
   * parameter representing a resource identifier
   */
  getPathResourceMappings(filterAuthEndpointsOut = true) {
    // todo: ensure that validation happens before
    // parameterName, parameterLocation, resourceAccess resourceName need to be valid
    const paths = this.getPaths();

    const filteredPaths = filterAuthEndpointsOut
      ? paths.filter((path) => {
          const isAuthEndpoint = Boolean(
            getOpenApiField(path.schema, OpenApiFieldNames.AUTH_ENDPOINT),
          );

          return !isAuthEndpoint;
        })
      : paths;

    return filteredPaths.map((path) => {
      const parameters = path.getParameters();

      const parametrizedResources =
        parameters.map((parameter) => ({
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
        })) ?? [];

      // todo: at the moment it is considered that there can be at most one non-parametrized resource per path (e.g. /users)
      const nonParametrizedResourceName = getOpenApiField(
        path.schema,
        OpenApiFieldNames.RESOURCE_NAME,
      );
      const nonParametrizedResourceAccess = getOpenApiField(
        path.schema,
        OpenApiFieldNames.RESOURCE_ACCESS,
      );
      const nonParametrizedResources =
        nonParametrizedResourceName && nonParametrizedResourceAccess
          ? [
              {
                resourceName: nonParametrizedResourceName,
                resourceAccess: nonParametrizedResourceAccess,
              },
            ]
          : [];

      const securityRequirements = path.getSecurity();
      const isPublicPath = securityRequirements.length === 0;

      const resources: Array<{
        resourceName: string;
        resourceAccess: string;
        parameterName?: string;
        parameterLocation?: string;
      }> = [...parametrizedResources, ...nonParametrizedResources];

      return {
        path: path.path,
        method: path.method,
        isPublicPath,
        resources,
      };
    });
  }

  /**
   * Transforms the paths schema from Oas to a minimal schema containing only
   * the necessary information
   */
  private transformPathsSchema(oasPaths: ReturnType<Oas["getPaths"]>) {
    return Object.values(oasPaths).flatMap((oasPath) => Object.values(oasPath));
  }

  // todo: move return type to another file
  /**
   * Returns the auth endpoint for the given security scheme identifier or null
   * if the authenticator type does not have an auth endpoint
   *
   * @param securityScheme
   * @param authenticatorType
   */
  getAuthEndpoint(
    securityScheme: SecurityScheme,
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
        const parameterLocation = parameter.type as ParameterLocation; // todo: fix type in openapi schema

        for (const propertyKey in parameter.schema.properties) {
          const property = parameter.schema.properties[propertyKey];

          // type can only be username or password
          // this should be validated before, then we can safely assume that the type is either username or password

          if (typeof property !== "object") {
            continue;
          }

          const authFieldType = parseOpenApiAuthField(property)?.type;

          if (authFieldType === "identifier") {
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

      if (
        authenticatorType === AuthenticatorType.API_KEY_COOKIE &&
        "name" in securityScheme
      ) {
        const authResponseParameterDescription = {
          parameterName: securityScheme.name,
          parameterLocation: securityScheme.in as ParameterLocation,
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

    // todo: create a separate method for this
    for (const responseStatusCode of responseStatusCodes) {
      const [response] =
        authEndpoint.getResponseAsJSONSchema(responseStatusCode);

      for (const propertyKey in response?.schema.properties) {
        const property = response.schema.properties[propertyKey];

        if (typeof property !== "object") {
          continue;
        }

        if (parseOpenApiAuthField(property)?.type === "token") {
          console.debug("token", propertyKey);
          // todo: what about nested parameter locations?
          return {
            parameterName: propertyKey,
            parameterLocation: "body",
          };
        }
      }
    }

    // todo: add proper error handling
    throw new Error("Token not found in the response body");
  }

  // todo: stricter types
  // todo: what if there are 0 security schemes?
  /**
   * Gets a security scheme for the given URL and HTTP method.
   *
   * @param url The fully-formed URL
   * @param httpMethod The HTTP method
   * @returns The security scheme or null if no security scheme is found in
   *   which case the route is considered public.
   */
  getSecurityScheme(url: string, httpMethod: string): SecurityScheme | null {
    // todo: figure out what happens to parametrized routes
    const operation = this.openApiSource.getOperation(
      url,
      httpMethod as HttpMethods,
    );

    if (!operation) {
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

  getAuthenticatorTypeBySecurityScheme(
    securityScheme: SecurityScheme,
  ): AuthenticatorType {
    const type = securityScheme.type;

    if (type === "http" && "scheme" in securityScheme) {
      const scheme = securityScheme.scheme;
      if (scheme === "Bearer") {
        return AuthenticatorType.HTTP_BEARER;
      } else if (scheme === "Basic") {
        return AuthenticatorType.HTTP_BASIC;
      }
    }

    if (type === "apiKey") {
      const location = securityScheme.in;
      if (location === "cookie") {
        return AuthenticatorType.API_KEY_COOKIE;
      }
    }

    return AuthenticatorType.NONE;
  }

  /**
   * Expands a URL template with the given parameters
   *
   * @param urlTemplateString The URL template as string to expand
   * @param parameters The parameters to expand the URL template with
   * @returns The expanded path or URL as string
   */
  static expandUrlTemplate(
    urlTemplateString: string,
    parameters: Record<string | number | symbol, string | number>,
  ): string {
    const urlTemplate = parseTemplate(urlTemplateString);

    return urlTemplate.expand(parameters);
  }

  constructFullApiUrl(url: string) {
    return new URL(url, this.apiBaseUrl);
  }

  static pathContainsParameter(path: string, parameterName: string) {
    return path.includes(`{${parameterName}}`);
  }

  /**
   * Get a Singleton instance of the authenticator based on the route if the
   * route requires authentication
   */
  getAuthenticatorByRoute(route: Route): RequestAuthenticator | null {
    const securityScheme = this.getSecurityScheme(
      route.url.toString(),
      route.method,
    );

    if (!securityScheme) {
      return null;
    }

    const securitySchemeKey = securityScheme._key;

    console.debug(securityScheme);
    console.debug("GOT SECURITY SCHEME: " + securitySchemeKey);

    const authenticatorType =
      this.getAuthenticatorTypeBySecurityScheme(securityScheme);

    // todo: can this result be cached or stored inside the state of the OpenApiParser?
    // so that mapping etc. only has to take place when specific auth strategy hasn't been queried yet

    const authEndpoint = this.getAuthEndpoint(
      securityScheme,
      authenticatorType,
    );

    return AuthenticationStore.getOrCreateAuthenticator(
      authenticatorType,
      this.apiBaseUrl,
      authEndpoint,
    );
  }
}
