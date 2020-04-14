import { AuthorizationProvider, CredentialSet } from "../auth";
import { Request } from "node-fetch";

// in development credentials are stored in .env
if (!process.env.CI) {
  require("dotenv").config();
}

// credentials are base64 encoded JSON strings
const decode = (cred: string | undefined): CredentialSet =>
  JSON.parse(Buffer.from(cred || "", "base64").toString("ascii"));

const credential1 = decode(process.env.credential1);

// tests against real live servers
describe("Authorization (live)", () => {
  it("adds the correct headers", async () => {
    const auth = new AuthorizationProvider([credential1]);
    await auth.init();
    const request = auth.authorize(new Request("https://example.com"));
    expect(request.headers.get("Ubi-AppId")).toBeTruthy();
    expect(request.headers.get("Authorization")).toBeTruthy();
  });
});
