import { SearchPlatform } from "./parameters";
import { Endpoint } from "./endpoint";

interface SearchQuery {
  nameOnPlatform: string;
  platformType: SearchPlatform;
}

interface Profile {
  profileId: string;
  userId: string;
  platformType: SearchPlatform;
  idOnPlatform: string;
  nameOnPlatform: string;
}

interface SearchAPIResponse {
  profiles: Profile[];
}

const search = new Endpoint<SearchQuery>(2, "profiles");

export { SearchQuery, SearchAPIResponse, search };
