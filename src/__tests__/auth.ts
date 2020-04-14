import { AuthorizationProvider, CredentialSet } from "../auth";
// mock node-fetch as an ESModule
jest.mock("node-fetch", () => {
  const nodeFetch = jest.requireActual("node-fetch");
  const mocked = require("fetch-mock").sandbox();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { default: exclude, ...internals } = nodeFetch;
  return {
    default: mocked,
    __esModule: true,
    ...internals,
    ...mocked,
  };
});
type mocked = typeof import("fetch-mock");
import _fetchMock, { Request, Response } from "node-fetch";
const fetchMock = (_fetchMock as unknown) as mocked;

// in development credentials are stored in .env
if (!process.env.CI) {
  require("dotenv").config();
}

// credentials are base64 encoded JSON strings
const decode = (cred: string | undefined): CredentialSet =>
  JSON.parse(Buffer.from(cred || "", "base64").toString("ascii"));

const credential1 = decode(process.env.credential1);
const credential2 = decode(process.env.credential2);

// JSON to Request body
const jsonBody = (json: object): ArrayBuffer => {
  const content = JSON.stringify(json, null, 2);
  return Uint8Array.from(Buffer.from(content)).buffer;
};

// successful and failed auth requests
const success = (url: string, options: object, request: Request): Response => {
  const future = new Date(new Date().getTime() + 60 * 60 * 1000);
  return new Response(
    jsonBody({
      // ensures ticket depends on credentials
      ticket: `TICKET-${request.headers.get("Authorization")}`,
      // ensures it will not attempt to refresh while other tests are running
      expiration: `${future.toDateString()} ${future.toTimeString()}`,
    }),
    {
      status: 200,
    }
  );
};
const failure = (): Response => new Response(undefined, { status: 201 });

// url to mock
const AUTH_URL = "https://public-ubiservices.ubi.com/v3/profiles/sessions";

describe("Authorization", () => {
  beforeEach(() => {
    fetchMock.restore();
    fetchMock.reset();
  });
  it("exports AuthorizationProvider", () => {
    expect(AuthorizationProvider).toBeTruthy();
  });
  it("adds the correct headers", async () => {
    const auth = new AuthorizationProvider([credential1]);
    fetchMock.mock(AUTH_URL, success);
    await auth.init();
    const request = auth.authorize(new Request("https://example.com"));
    expect(request.headers.get("Ubi-AppId")).toBeTruthy();
    expect(request.headers.get("Authorization")).toBeTruthy();
  });
  it("switches credentials", async () => {
    const auth = new AuthorizationProvider([credential1, credential2]);
    fetchMock.mock(AUTH_URL, success);
    await auth.init();
    const request = auth.authorize(new Request("https://example.com"));
    const request2 = auth.authorize(new Request("https://example.com"));
    expect(request.headers.get("Authorization")).not.toEqual(
      request2.headers.get("Authorization")
    );
  });
  it("retries failed requests", async () => {
    // first response is a soft failure
    // second is a success
    fetchMock
      .mock(AUTH_URL, failure, { repeat: 1 })
      .once(AUTH_URL, success, { overwriteRoutes: false, repeat: 1 });
    const provider = new AuthorizationProvider([credential1]);
    await provider.init();
    expect(fetchMock.calls().length).toEqual(2);
  }, 10000);
  it("stops after multiple failures", async () => {
    fetchMock.mock(AUTH_URL, failure);
    const provider = new AuthorizationProvider([credential1]);
    await provider.init();
    expect(fetchMock.calls().length).toBeGreaterThan(1);
    expect(fetchMock.calls().length).toBeLessThan(10);
  }, 10000);
});
