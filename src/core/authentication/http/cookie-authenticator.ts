import { ApiClient, ApiResponse } from "@japa/api-client";
import { ApiRequest } from "@japa/api-client/build/src/request";
import { OpenAPIParser } from "../../parsers/openapi-parser";
import { RequestAuthenticator } from "./authenticator";
import { SessionManager } from "./session-manager";
import { AuthenticationCredentials, CookieAuthSession } from "./types";

export class CookieAuthenticator
  extends SessionManager<CookieAuthSession>
  implements RequestAuthenticator
{
  constructor(
    private authEndpointInformation: Awaited<
      ReturnType<OpenAPIParser["getAuthEndpoint"]>
    >,
  ) {
    super();
  }

  protected async initializeSession(credentials: AuthenticationCredentials) {
    console.log("init new cookie session");
    // todo: make base url configurable as param
    // read the value from a config prop or the OpenAPI spec
    const apiClient = new ApiClient("http://localhost:3333");

    // todo: fix issue with type
    // todo: this will probably change!

    const {
      authEndpoint,
      authRequestParameterDescription,
      authResponseParameterDescription,
    } = this.authEndpointInformation;

    const { parameterName: usernameParameterName } =
      authRequestParameterDescription.username;
    const { parameterName: passwordParameterName } =
      authRequestParameterDescription.password;

    if (!usernameParameterName || !passwordParameterName) {
      // todo: better error handling
      // todo: maybe use a default value as fallback for email/password field names
      throw new Error("Username and password parameter names are required");
    }

    // names are in authRequestParameterDescription
    // todo: create a helper function that creates the request (this is the same as in BearerAuthenticator)
    const response: ApiResponse = await apiClient
      .request(authEndpoint.path, authEndpoint.method)
      .json({
        [usernameParameterName]: credentials.identifier, // todo: make field names generic, get this from authRequestParameterDescription
        [passwordParameterName]: credentials.password,
      });

    const { parameterName: cookieParameterName } =
      authResponseParameterDescription;

    // todo: make this configurable
    // todo: clarify if STORE_ALL_COOKIES mode could help with csrf protection set
    const STORE_ALL_COOKIES = true;
    let session: CookieAuthSession;

    if (STORE_ALL_COOKIES) {
      // todo: maybe store cookies as an object map instead of an array
      session = {
        cookies: Object.values(response.cookies()).map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        })),
        // todo: maybe include expiration and other provided information too?
        // expiresAt: cookie.expires, // store expiry of auth cookie
      };
      this.sessionStore.set(credentials.identifier, session);
    } else {
      const cookie = response.cookie(cookieParameterName);
      if (!cookie) {
        // todo: add error handling
        throw new Error(
          "No cookie found in server response for the login endpoint",
        );
      }

      // todo: add error handling

      // todo: if token expiry is not defined in response (in our case token.expiresAt), read out token to store this extra piece of information

      // todo: get expiry from maxAge?
      session = {
        cookies: [
          {
            name: cookieParameterName,
            value: cookie.value,
          },
        ],
        expiresAt: cookie.expires,
      };
    }

    return session;
  }

  public async authenticateRequest(
    request: ApiRequest,
    credentials: AuthenticationCredentials,
  ) {
    const session = await this.findOrInitializeSession(credentials);

    const sessionCookies = session.cookies.reduce(
      (a, { name, value }) => ({ ...a, [name]: value }),
      {},
    );

    request.cookies(sessionCookies);
  }
}
