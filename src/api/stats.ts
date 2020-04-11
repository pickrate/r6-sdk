import { Statistic } from "./parameters";
import { PlatformEndpoint } from "./endpoint";

interface StatsQuery {
  populations: string | string[];
  statistics: Statistic | Statistic[];
}

interface StatsAPIResponse {
  results: {
    [profileId: string]: {
      // unfortunately the response has new fields added, so there's not much value typing it
      [statSlug: string]: number;
    };
  };
}
const stats = new PlatformEndpoint<StatsQuery>(1, "playerstats2/statistics");

export { StatsQuery, StatsAPIResponse, stats };
