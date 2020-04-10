import { Endpoint, PlatformEndpoint, Platform } from "./endpoint";

type NoQuery = undefined;

enum Mode {
  ranked = "pvp_ranked",
  casual = "pvp_casual",
}

enum Region {
  na = "ncsa",
  europe = "emea",
  asia = "apac",
}

enum Statistic {
  /* secondary mode related stats */
  secureAreaWins = "secureareapvp_matchwon",
  secureAreaLosses = "secureareapvp_matchlost",
  secureAreaMatches = "secureareapvp_matchplayed",
  secureAreaHighScore = "secureareapvp_bestscore",
  hostageWins = "rescuehostagepvp_matchwon",
  hostageLosses = "rescuehostagepvp_matchlost",
  hostageMatches = "rescuehostagepvp_matchplayed",
  hostageHighScore = "rescuehostagepvp_bestscore",
  bombWins = "plantbombpvp_matchwon",
  bombLosses = "plantbombpvp_matchlost",
  bombMatches = "plantbombpvp_matchplayed",
  bombHighScore = "plantbombpvp_bestscore",
  /* casual general stats */
  casualPlaytime = "casualpvp_timeplayed",
  casualWins = "casualpvp_matchwon",
  casualLosses = "casualpvp_matchlost",
  casualMatches = "casualpvp_matchplayed",
  casualKills = "casualpvp_kills",
  casualDeaths = "casualpvp_death",
  /* ranked general stats */
  rankedPlaytime = "rankedpvp_timeplayed",
  rankedWins = "rankedpvp_matchwon",
  rankedLosses = "rankedpvp_matchlost",
  rankedMatches = "rankedpvp_matchplayed",
  rankedKills = "rankedpvp_kills",
  rankedDeaths = "rankedpvp_death",
  /* general stats */
  playtime = "generalpvp_timeplayed",
  matches = "generalpvp_matchplayed",
  assists = "generalpvp_killassists",
  revives = "generalpvp_revive",
  headshots = "generalpvp_headshot",
  penetrationKills = "generalpvp_penetrationkills",
  meleeKills = "generalpvp_meleekills",
  wins = "generalpvp_matchwon",
  losses = "generalpvp_matchlost",
  kills = "generalpvp_kills",
  deaths = "generalpvp_death",
  hits = "generalpvp_bullethit",
  shots = "generalpvp_bulletfired",
  /* per weapon type stats */
  killsByWeaponType = "weapontypepvp_kills",
  headshotsByWeaponType = "weapontypepvp_headshot",
  shotsByWeaponType = "weapontypepvp_bulletfired",
  hitsByWeaponType = "weapontypepvp_bullethit",
  /* per operator stats */
  playtimeByOperator = "operatorpvp_timeplayed",
  winsByOperator = "operatorpvp_roundwon",
  lossesByOperator = "operatorpvp_roundlost",
  killsByOperator = "operatorpvp_kills",
  deathsByOperator = "operatorpvp_death",
  /* operator gadgets */
  smokeGadget = "operatorpvp_smoke_poisongaskill",
  muteGadget = "operatorpvp_mute_gadgetjammed",
  sledgeGadget = "operatorpvp_sledge_hammerhole",
  thatcherGadget = "operatorpvp_thatcher_gadgetdestroywithemp",
  castleGadget = "operatorpvp_castle_kevlarbarricadedeployed",
  ashGadget = "operatorpvp_ash_bonfirewallbreached",
  pulseGadget = "operatorpvp_pulse_heartbeatspot",
  thermiteGadget = "operatorpvp_thermite_reinforcementbreached",
  docGadget = "operatorpvp_doc_teammaterevive",
  rookGadget = "operatorpvp_rook_armortakenteammate",
  twitchGadget = "operatorpvp_twitch_gadgetdestroybyshockdrone",
  montagneGadget = "operatorpvp_montagne_shieldblockdamage",
  glazGadget = "operatorpvp_glaz_sniperkill",
  fuzeGadget = "operatorpvp_fuze_clusterchargekill",
  kapkanGadget = "operatorpvp_kapkan_boobytrapkill",
  tchankaGadget = "operatorpvp_tachanka_turretkill",
  blitzGadget = "operatorpvp_blitz_flashedenemy",
  iqGadget = "operatorpvp_iq_gadgetspotbyef",
  jagerGadget = "operatorpvp_jager_gadgetdestroybycatcher",
  banditGadget = "operatorpvp_bandit_batterykill",
  buckGadget = "operatorpvp_buck_kill",
  frostGadget = "operatorpvp_frost_dbno",
  blackbeardGadget = "operatorpvp_blackbeard_gunshieldblockdamage",
  valkyrieGadget = "operatorpvp_valkyrie_camdeployed",
  capitaoGadget = "operatorpvp_capitao_lethaldartkills",
  hibanaGadget = "operatorpvp_hibana_detonate_projectile",
  echoGadget = "operatorpvp_echo_enemy_sonicburst_affected",
  jackalGadget = "operatorpvp_cazador_assist_kill",
  miraGadget = "operatorpvp_black_mirror_gadget_deployed",
  yingGadget = "operatorpvp_dazzler_gadget_detonate",
  lesionGadget = "operatorpvp_caltrop_enemy_affected",
  elaGadget = "operatorpvp_concussionmine_detonate",
  zofiaGadget = "operatorpvp_concussiongrenade_detonate",
  dokkebiGadget = "operatorpvp_phoneshacked",
  vigilGadget = "operatorpvp_attackerdrone_diminishedrealitymode",
  lionGadget = "operatorpvp_tagger_tagdevice_spot",
  finkaGadget = "operatorpvp_rush_adrenalinerush",
  maestroGadget = "operatorpvp_barrage_killswithturret",
  alibiGadget = "operatorpvp_deceiver_revealedattackers",
  maverickGadget = "operatorpvp_maverick_wallbreached",
  clashGadget = "operatorpvp_clash_sloweddown",
  nomadGadget = "operatorpvp_nomad_airjabdetonate",
  kaidGadget = "operatorpvp_kaid_electroclawelectrify",
  mozziegadget = "operatorpvp_mozzie_droneshacked",
  gridlockgadget = "operatorpvp_gridlock_traxdeployed",
  bokkGadget = "operatorpvp_nokk_observationtooldeceived",
  wardengadget = "operatorpvp_warden_killswithglasses",
  goyoGadget = "operatorpvp_goyo_volcandetonate",
  amaruGadgt = "operatorpvp_amaru_distancereeled",
  kaliGadget = "operatorpvp_kali_gadgetdestroywithexplosivelance",
  wamaigadget = "operatorpvp_wamai_gadgetdestroybymagnet",
  oryxGadget = "operatorpvp_oryx_killsafterdash",
  ianaGadget = "operatorpvp_iana_killsafterreplicator",
  // for some reason cav doesn't have a unqiue stat
}

const allStats = Object.values(Statistic);

interface StatsQuery {
  board_id: Mode;
  profile_ids: string | string[];
  region_id: Region;
  season_id: number;
}

interface StatsAPIResponse {
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

interface Stats2Query {
  populations: string | string[];
  statistics: Statistic | Statistic[];
}

interface Stats2APIResponse {
  results: {
    [profileId: string]: {
      // unfortunately the response has new fields added, so there's not much value typing it
      [statSlug: string]: number;
    };
  };
}

enum SearchPlatform {
  twitch = "twitch",
  xbox = "xbl",
  playstation = "psn",
  pc = "uplay",
  steam = "steam",
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

interface SearchQuery {
  nameOnPlatform: string;
  platformType: SearchPlatform;
}

const login = new Endpoint<NoQuery>(3, "profiles/sessions");
const stats = new PlatformEndpoint<StatsQuery>(1, "r6karma/players");
const stats2 = new PlatformEndpoint<Stats2Query>(1, "playerstats2/statistics");
const search = new Endpoint<SearchQuery>(2, "profiles");
const progression = new PlatformEndpoint<ProgressionQuery>(
  1,
  "r6playerprofile/playerprofile/progressions"
);

export {
  login,
  stats,
  stats2,
  search,
  progression,
  Platform,
  SearchPlatform,
  Mode,
  Region,
  Statistic,
  allStats,
  SearchQuery,
  StatsQuery,
  Stats2Query,
  ProgressionQuery,
  SearchAPIResponse,
  Profile,
  ProgressionAPIResponse,
  PlayerProfile,
  StatsAPIResponse,
  Stats2APIResponse,
};
