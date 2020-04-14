import { CredentialSet } from "../auth";
import { Siege } from "../index";
import { SearchPlatform, Mode, Region, allStats } from "../api/parameters";
import { Platform } from "../api/endpoint";

// in development credentials are stored in .env
if (!process.env.CI) {
  require("dotenv").config();
}

const PROFILE_ID = "91270442-e4ff-4b00-a53d-7f24d69bd824";
const PROFILE_ID_2 = "16679d8c-bffa-42b4-9cd9-4bb3fd77a880";

// credentials are base64 encoded JSON strings
const decode = (cred: string | undefined): CredentialSet =>
  JSON.parse(Buffer.from(cred || "", "base64").toString("ascii"));

const credential1 = decode(process.env.credential1);
const credential2 = decode(process.env.credential2);

const r6 = new Siege([credential1, credential2]);

// tests against real live servers
describe("Rainbow Six Siege SDK (live)", () => {
  beforeAll(async () => {
    await r6.init();
  });
  it("finds players by name", async () => {
    const { profileId } = (await r6.getPlayer(
      "FledRose0",
      SearchPlatform.pc
    )) || { profileId: null };
    expect(profileId).toBe(PROFILE_ID);
  });
  it("finds players based on near matches", async () => {
    // search doesn't seem to return multiple results, so don't test for that
    const results = (await r6.search("fledrose0", SearchPlatform.pc)) || [];
    expect(results.map((r) => r.profileId)).toContain(PROFILE_ID);
  });
  it("tracks player progression", async () => {
    const { xp } = (await r6.getProgression(PROFILE_ID, Platform.pc)) || {
      xp: 0,
    };
    expect(xp).toBeGreaterThan(15000);
  });
  it("tracks ranked stats", async () => {
    // don't want tests to break if I don't play for a season
    const { season } = (await r6.getRank(
      PROFILE_ID,
      Platform.pc,
      Mode.ranked,
      Region.na,
      -1
    )) || { season: 0 };
    // this should only increase in the future
    expect(season).toBeGreaterThanOrEqual(17);
  });
  it("tracks stats", async () => {
    const result = await r6.getStats(PROFILE_ID, Platform.pc, allStats);
    expect(result).not.toBeNull();
    if (result && result.profile) {
      const {
        profile: {
          general: { kills },
        },
      } = result;
      expect(kills).toBeGreaterThan(950);
    }
  });
  it("supports bulk queries", async () => {
    const results =
      (await r6.getBulkStats(
        [PROFILE_ID, PROFILE_ID_2],
        Platform.pc,
        allStats
      )) || {};
    expect(Object.keys(results).length).toBeGreaterThan(1);
  });
});
