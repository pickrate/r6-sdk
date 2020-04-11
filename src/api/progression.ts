import { PlatformEndpoint } from "./endpoint";

interface ProgressionQuery {
  profile_ids: string | string[];
}

interface PlayerProfile {
  xp: number;
  profile_id: string;
  lootbox_probability: number;
  level: number;
}

interface ProgressionAPIResponse {
  player_profiles: PlayerProfile[];
}

const progression = new PlatformEndpoint<ProgressionQuery>(
  1,
  "r6playerprofile/playerprofile/progressions"
);

export { ProgressionQuery, ProgressionAPIResponse, progression };
