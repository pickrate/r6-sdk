import { AuthorizationProvider, CredentialSet } from "./auth";
import {
  Mode,
  SearchPlatform,
  Region,
  Statistic,
  allStats,
} from "./api/parameters";
import { Platform } from "./api/endpoint";
import {
  ProgressionQuery,
  ProgressionAPIResponse,
  progression,
} from "./api/progression";
import { RankQuery, RankAPIResponse, rank } from "./api/rank";
import { SearchQuery, SearchAPIResponse, search } from "./api/search";
import { StatsQuery, StatsAPIResponse, stats } from "./api/stats";
import fetch, { Request } from "node-fetch";
import { Endpoint, PlatformEndpoint } from "./api/endpoint";

interface PlayerProfile {
  platformId: string;
  profileId: string;
  userId: string;
  name: string;
  platform: SearchPlatform;
}

interface ProfileProgression {
  xp: number;
  level: number;
  packChance: number;
  profileId: string;
}

interface ProfileRank {
  maxMmr: number;
  maxRank: number;
  topRanking: number;
  mmr: number;
  rank: number;
  skillSD: number;
  kills: number;
  deaths: number;
  wins: number;
  losses: number;
  abandons: number;
  skillMean: number;
  mmrChange: number;
  skillSDChange: number;
  skillMeanChange: number;
  updated: string;
  matchResult: number;
  previousRankMmr: number;
  nextRankMmr: number;
  region: Region;
  profileId: string;
  season: number;
  mode: Mode;
}

interface ProfileStats {
  [category: string]:
    | {
        [id: string]: { stat: number };
      }
    | { stat: number };
}

interface APIError {
  error: string;
}

type lookup = { [key: string]: string };
const statLookup: { weapons: lookup; operator: lookup; profile: lookup } = {
  weapons: {
    kills: "kills",
    headshot: "headshots",
    bullethit: "hits",
  },
  operator: {
    timeplayed: "playtime",
    kills: "kills",
    death: "deaths",
    roundwon: "wins",
    roundlost: "losses",
  },
  profile: {
    bullethit: "hits",
    headshot: "headshots",
    revive: "revives",
    penetrationkills: "penetrationKills",
    kills: "kills",
    matchplayed: "matches",
    timeplayed: "playtime",
    death: "deaths",
    meleekills: "meleeKills",
    matchwon: "wins",
    matchlost: "losses",
    killassists: "kills",
    bestscore: "highscore",
  },
};

const patterns = {
  basic: /([a-z]+)_([a-z]+)():([A-F0-9]*:[A-F0-9]*):infinite/,
  named: /([a-z]+)_([a-z]+)_([a-z]+):([A-F0-9]*:[A-F0-9]*):infinite/,
  weapon: /([a-z]+)_([a-z]+)():([A-F0-9]*):infinite/,
  profile: /([a-z]+)pvp_([a-z]+)()():infinite/,
};

/**
 * Finds the stat path
 *
 * @param stat - original stat name
 */
const statPath = (
  stat: string
): [string, string] | [string, string, string] => {
  // although it is possible to construct an operator id => table,
  // it may be incomplete if not all operator stats are queried,
  // as a result, this will not be used (yet)
  let match: RegExpMatchArray | null;
  // first check if it's an operator stat
  // lots of cleanup potential here
  match = stat.match(patterns.named);
  if (match !== null) {
    return ["operators", (match && match[4]) || "unknownId", "gadget"];
  }
  match = stat.match(patterns.weapon);
  if (match !== null) {
    return [
      "weapons",
      (match && match[4]) || "unknownId",
      (match && statLookup.weapons[match[2]]) || "unknownStat",
    ];
  }
  match = stat.match(patterns.profile);
  if (match !== null) {
    return [
      "profile",
      (match && match[1]) || "unknownId",
      (match && statLookup.profile[match[2]]) || "unknownStat",
    ];
  }
  match = stat.match(patterns.basic);
  if (match !== null) {
    return [
      "operators",
      (match && match[4]) || "unknownId",
      (match && statLookup.operator[match[2]]) || "unknownStat",
    ];
  } else {
    return ["unknownSegment", "unknownId", "unknownStat"];
  }
};

class Siege {
  private auth: AuthorizationProvider;
  /**
   * Creates an API client.
   *
   * @param credentials - credentials for the client instance
   */
  constructor(credentials: CredentialSet[]) {
    if (credentials.length === 0) {
      throw new Error("No authentication provided");
    }
    this.auth = new AuthorizationProvider(credentials);
  }
  /**
   * Performs initial setup (authentication).
   */
  async init(): Promise<void> {
    await this.auth.init();
  }
  /**
   * Makes an authenticated API request.
   *
   * @param endpoint - endpoint to GET
   */
  private async get<Q, R>(
    endpoint: Endpoint<Q> | PlatformEndpoint<Q>
  ): Promise<R | APIError> {
    const request = this.auth.authorize(
      new Request(endpoint.url(), { method: "GET" })
    );
    // TODO: error handling
    const response = (await fetch(request).then((r) => r.json())) as R;
    return response;
  }
  /**
   * Searches for players by name.
   *
   * @param query - the search term
   * @param platform - platform to search
   */
  async search(
    query: string,
    platform: SearchPlatform
  ): Promise<PlayerProfile[] | null> {
    const response = await this.get<SearchQuery, SearchAPIResponse>(
      search.query({
        nameOnPlatform: query,
        platformType: platform,
      })
    );
    if ("profiles" in response && response.profiles.length > 0) {
      return response.profiles.map(
        ({
          profileId,
          userId,
          platformType: platform,
          idOnPlatform: platformId,
          nameOnPlatform: name,
        }) => {
          return {
            profileId,
            userId,
            platformId,
            platform,
            name,
          };
        }
      );
    } else {
      return null;
    }
  }
  /**
   * Checks for a player exactly matching the given name
   *
   * @param name - player name (must be an EXACT match)
   * @param platform - platform to search
   */
  async getPlayer(
    name: string,
    platform: SearchPlatform
  ): Promise<PlayerProfile | null> {
    const search = await this.search(name, platform);
    if (search && search.length > 0) {
      const matches = search.filter((player) => player.name === name);
      if (matches.length > 0) {
        return matches[0];
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
  /**
   * Convenience wrapper around getProgressions for fetching a single result
   *
   * @param profile - profile to get progression for
   * @param platform - platform to get progression on
   */
  async getProgression(
    profile: string,
    platform: Platform
  ): Promise<ProfileProgression | null> {
    const response = await this.getProgressions([profile], platform);
    if (response && response[profile]) {
      return response[profile];
    } else {
      return null;
    }
  }
  /**
   * Gets players' progression in game.
   *
   * @param profiles - profiles to get progression for
   * @param platform - platform to get progression on
   */
  async getProgressions(
    profiles: string[],
    platform: Platform
  ): Promise<{ [profileId: string]: ProfileProgression } | null> {
    const response = await this.get<ProgressionQuery, ProgressionAPIResponse>(
      progression.setPlatform(platform).query({
        // eslint-disable-next-line @typescript-eslint/camelcase
        profile_ids: profiles,
      })
    );
    if ("player_profiles" in response && response.player_profiles.length > 0) {
      return response.player_profiles
        .map(
          ({
            xp,
            level,
            lootbox_probability: packChance,
            profile_id: profileId,
          }) => {
            return {
              xp,
              level,
              packChance,
              profileId,
            };
          }
        )
        .reduce((obj, profile) => {
          obj[profile.profileId] = profile;
          return obj;
        }, {} as { [profileId: string]: ProfileProgression });
    }
    return null;
  }
  /**
   * Convenience wrapper around getRanks
   *
   * @param profile - profile to get ranks for
   * @param platform - platform for stats
   * @param board - game mode for rank
   * @param region - region for rank
   * @param season - season for rank
   */
  async getRank(
    profile: string,
    platform: Platform,
    board: Mode,
    region: Region,
    season: number
  ): Promise<null | ProfileRank> {
    const response = await this.getRanks(
      [profile],
      platform,
      board,
      region,
      season
    );
    if (response !== null && response[profile] !== null) {
      return response[profile];
    } else {
      return null;
    }
  }
  /**
   * Get players' rank in game.
   *
   * @param profiles - profiles to get ranks for
   * @param platform - platform for stats
   * @param board - game mode for rank
   * @param region - region for rank
   * @param season - season for rank
   */
  async getRanks(
    profiles: string[],
    platform: Platform,
    board: Mode,
    region: Region,
    season: number
  ): Promise<null | { [profileId: string]: ProfileRank }> {
    const response = await this.get<RankQuery, RankAPIResponse>(
      rank.setPlatform(platform).query({
        // eslint-disable-next-line @typescript-eslint/camelcase
        profile_ids: profiles,
        // eslint-disable-next-line @typescript-eslint/camelcase
        board_id: board,
        // eslint-disable-next-line @typescript-eslint/camelcase
        region_id: region,
        // eslint-disable-next-line @typescript-eslint/camelcase
        season_id: season,
      })
    );
    if ("error" in response) {
      return null;
    } else {
      return Object.entries(response.players).reduce(
        (
          object,
          [
            profileId,
            {
              max_mmr: maxMmr,
              max_rank: maxRank,
              top_rank_position: topRanking,
              mmr,
              rank,
              skill_stdev: skillSD,
              kills,
              deaths,
              wins,
              losses,
              abandons,
              skill_mean: skillMean,
              last_match_mmr_change: mmrChange,
              last_match_skill_stdev_change: skillSDChange,
              last_match_skill_mean_change: skillMeanChange,
              update_time: updated,
              last_match_result: matchResult,
              previous_rank_mmr: previousRankMmr,
              next_rank_mmr: nextRankMmr,
              board_id: mode,
            },
          ]
        ) => {
          object[profileId] = {
            maxMmr,
            maxRank,
            topRanking,
            mmr,
            rank,
            skillSD,
            kills,
            deaths,
            wins,
            losses,
            abandons,
            skillMean,
            mmrChange,
            skillSDChange,
            skillMeanChange,
            updated,
            matchResult,
            previousRankMmr,
            nextRankMmr,
            region,
            profileId,
            season,
            mode,
          };
          return object;
        },
        {} as { [profileId: string]: ProfileRank }
      );
    }
  }
  /**
   * Convenience wrapper around getBulkStats
   *
   * @param profiles - profiles to get stats for
   * @param platform - platform to get stats on
   * @param stats - stats to get
   */
  async getStats(
    profiles: string,
    platform: Platform,
    stats: Statistic[]
  ): Promise<null | ProfileStats> {
    const result = await this.getBulkStats([profiles], platform, stats);
    if (result !== null && result[profiles] !== null) {
      return result[profiles];
    } else {
      return null;
    }
  }
  /**
   * Retrieves requested stats for all profiles
   *
   * @param profiles - profiles to get stats for
   * @param platform - platform to get stats on
   * @param statistics - stats to get
   */
  async getBulkStats(
    profiles: string[],
    platform: Platform,
    statistics: Statistic[]
  ): Promise<null | { [profileId: string]: ProfileStats }> {
    const response = await this.get<StatsQuery, StatsAPIResponse>(
      stats.setPlatform(platform).query({ populations: profiles, statistics })
    );
    if ("results" in response) {
      return Object.entries(response.results).reduce(
        (obj, [profileId, stats]) => {
          obj[profileId] = Object.entries(stats).reduce(
            (root, [stat, value]) => {
              // this is so messy that it lives on its own
              // the types are very loose here because of uneven nesting between stat types
              // definitely will be worth cleaning up in the future
              const path = statPath(stat);
              const end = path[path.length - 1];
              // traverse the path, filling in with empties as needed
              // this isn't exactly "functional", but it works (and is cleaner than the loop equivalent)
              return path.reduce((parent, pathSegment) => {
                if (pathSegment === end) {
                  parent[pathSegment] = value;
                  return root; // the root
                }
                // works because the object is passed by reference to future loops
                if (!parent[pathSegment]) parent[pathSegment] = {};
                return parent[pathSegment];
              }, root as { [key: string]: any });
            },
            {} as ProfileStats
          );
          return obj;
        },
        {} as { [profileId: string]: ProfileStats }
      );
    } else {
      return null;
    }
  }
}
// the main goal is to clean up the disgusting data that ubi provides

export { Siege, SearchPlatform, Platform, Mode, Region, Statistic, allStats };
