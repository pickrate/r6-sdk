import { Mode, Region } from "./parameters";
import { PlatformEndpoint } from "./endpoint";

interface RankQuery {
  board_id: Mode;
  profile_ids: string | string[];
  region_id: Region;
  season_id: number;
}

interface RankAPIResponse {
  players: {
    // eslint-disable-next-line @typescript-eslint/camelcase
    [profile_id: string]: {
      // this season
      max_mmr: number;
      max_rank: number;
      top_rank_position: number;
      // current state
      mmr: number;
      rank: number;
      skill_stdev: number;
      kills: number;
      deaths: number;
      wins: number;
      losses: number;
      abandons: number;
      skill_mean: number;
      //  update
      last_match_mmr_change: number;
      last_match_skill_stdev_change: number;
      last_match_skill_mean_change: number;
      update_time: string;
      last_match_result: number; // TODO: figure out what these equate to
      // constants
      previous_rank_mmr: number;
      next_rank_mmr: number;
      // from query
      profile_id: string;
      region: Region;
      season: number;
      board_id: Mode;
    };
  };
}

const rank = new PlatformEndpoint<RankQuery>(1, "r6karma/players");

export { RankQuery, RankAPIResponse, rank };
