import fetch, { Headers, Request } from "node-fetch";
import { login } from "./api/login";

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const APP_ID = "39baebad-39e5-4552-8c25-2c9b919064e2";
const HEADSTART = 1 * 60 * 1000;
const RETRY_INTERVAL = 1 * 1000;
const RETRY_LIMIT = 5;
const THROTTLE_BUFFER = 1 * 1000;

// login for an account
interface CredentialSet {
  email: string;
  password: string;
}

type Token = string;

// response to login
interface AuthToken {
  token: string;
  expires: number;
}

type AuthCache = { [token: string]: AuthToken };

interface AuthResponse {
  platformType: string;
  ticket: string;
  twoFactorAuthenticationTicket: string | null;
  profileId: string;
  userId: string;
  nameOnPlatform: string;
  environment: string;
  expiration: string;
  spaceId: string;
  clientIp: string;
  clientIpCountry: string;
  serverTime: string;
  sessionId: string;
  sessionKey: string;
  rememberMeTicket: string;
}

interface RateLimitResponse {
  message: string;
  errorCode: number;
  httpCode: number;
  errorContext: string;
  moreInfo: string;
  transactionTime: string;
  transactionId: string;
  environment: string;
}

/*
auth flow:
credentials => token => ticket
*/

class AuthorizationProvider {
  private tokens: Token[];
  private cache: AuthCache;
  private index: number;
  /**
   * Handles distributing requests across multiple sets of credentials and caching tokens for their lifetime
   * Ubisoft does not currently seem to throttle requests, but it's better safe than sorry.
   *
   * @param credentials - sets of credentials to add
   */
  constructor(credentials: CredentialSet[] = []) {
    this.tokens = credentials.map(this.encode);
    this.cache = {};
    this.index = 0;
  }
  /**
   * Initializes the AuthorizationProvider by filling the cache with active tokens.
   * Tokens will automatically refresh after they expire.
   * This ensures that retrieving a token is ALWAYS synchronous after initialization and can take a few seconds
   *
   * Important: An AuthorizationProvider must complete initialization before other methods are called.
   */
  async init(): Promise<void> {
    await Promise.all(this.tokens.map(this.refresh.bind(this)));
  }
  /**
   * Add a set of credentials into rotation
   *
   * @param credentials - a set of credentials to add
   */
  add(credentials: CredentialSet): void {
    const token = this.encode(credentials);
    this.tokens.push(token);
    this.refresh(token);
  }
  /**
   * Adds authorization headers to a Request for interacting with the Ubisoft APIs.
   *
   * @param request - A Request to add authorization headers to
   */
  authorize(request: Request): Request {
    const limit = this.tokens.length;
    if (limit === 0) {
      throw new Error("No credentials provided.");
    }
    const token = this.cache[this.tokens[this.index % limit]];
    this.index = (this.index + 1) % limit;
    // append headers to existing headers
    Object.entries(this.headers(`Ubi_v1 t=${token.token}`)).forEach(
      ([key, value]) => {
        request.headers.append(key, value);
      }
    );
    return request;
  }
  /**
   * Encodes credentials as a Basic authentication token
   *
   * @param credentials - a CredentialSet to encode as a Basic token
   */
  private encode({ email, password }: CredentialSet): Token {
    return `Basic ${Buffer.from(`${email}:${password}`, "utf8").toString(
      "base64"
    )}`;
  }
  /**
   * Retrieves the email and password from a Basic token
   *
   * @param token - a Basic token to decode
   */
  private decode(token: Token): CredentialSet {
    const payload = Buffer.from(token.slice(6), "base64").toString("utf-8");
    const split = payload.indexOf(":");
    return {
      email: payload.slice(0, split),
      password: payload.slice(split + 1),
    };
  }
  /**
   * Warms the provider with a Ubi_v1 authorization token given a Basic authentication token
   *
   * @param token - Basic token
   * @param attempt - how many times the token has failed
   */
  private async refresh(token: Token, attempt = 0): Promise<void> {
    if (attempt === RETRY_LIMIT) {
      this.invalidate(token, "Retry limit reached for");
      return;
    }
    // hit API to receive a token that is actually useful (ticket)
    const request = new Request(login.url(), {
      method: "POST",
      headers: new Headers(this.headers(token)),
      body: JSON.stringify({ rememberMe: true }),
    });
    const res = await fetch(request);
    switch (res.status) {
      // success
      case 200:
        const json: AuthResponse = await res.json();
        if (json.ticket && json.expiration) {
          const expiration = new Date(json.expiration).getTime();
          const now = new Date().getTime();
          // schedule a refresh before expiration
          this.scheduleRefresh(token, expiration - now - HEADSTART);
          this.cache[token] = {
            token: json.ticket,
            expires: expiration,
          };
          return;
        }
        break;
      // invalid credentials
      case 401:
        this.invalidate(token, "Invalid credentials provided for");
        return;
      case 429:
        const error: RateLimitResponse = await res.json();
        const now = new Date().getTime();
        const retry = new Date(`${error.moreInfo} GMT-0000`).getTime();
        console.warn(
          `API is rate limiting requests. Reason: ${error.message}.`
        );

        await sleep(retry - now + THROTTLE_BUFFER);
        break;

      // unknown response
      default:
        console.log(`Unknown auth response ${res.status}.`);
        break;
    }
    // retry everything except a success
    await sleep(RETRY_INTERVAL);
    await this.refresh(token, attempt + 1);
  }
  /**
   * Schedules a refresh of the authorization token associated with an authentication token.
   *
   * @param token - Basic authentication token to refresh
   * @param ms - how long until the refresh should fire
   */
  private async scheduleRefresh(token: Token, ms: number): Promise<void> {
    await sleep(ms);
    this.refresh(token);
  }
  /**
   * Removes a Basic authentication token from rotation
   *
   * @param token - a token which has been rejected
   */
  private invalidate(token: Token, reason: string): void {
    const { email } = this.decode(token);
    console.warn(
      `${reason} ${email}. The credentials have been invalidated and will not be reused.`
    );
    this.tokens.splice(this.tokens.indexOf(token), 1);
  }
  /**
   * Returns headers required for an authorized Ubisoft API request.
   *
   * @param token - token to use as the Authorization header
   */
  private headers(token: string): { [key: string]: string } {
    return {
      "Ubi-AppId": APP_ID,
      Authorization: token,
      "Content-Type": "application/json",
    };
  }
}

export { AuthorizationProvider, CredentialSet };
