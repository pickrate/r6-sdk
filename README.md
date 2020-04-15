[![Travis (.com)](https://travis-ci.com/pickrate/r6-sdk.svg?token=YgB8n2pFukyGcmwgZh7W&branch=master)](https://travis-ci.com/pickrate/r6-sdk)
[![npm](https://img.shields.io/npm/v/@rainbow6/sdk?label=@rainbow6/sdk&logo=npm)](https://www.npmjs.com/package/@rainbow6/sdk)

# `@rainbow6/sdk`

> Typescript SDK for the Rainbow 6 API

# Usage

> Important: This module requires credentials to access Ubisoft accounts. 
It should only be used on backend servers and the credentials should be handled as you would handle any other secure value. 
It is recommended to create a new account for using the API.

## Installation

```bash
npm install @rainbow6/sdk
```

## Example

```js
const {
  Siege,
  SearchPlatform,
  Platform,
  Mode,
  Region,
  allStats,
} = require("@rainbow6/sdk");

(async () => {
  const r6 = new Siege([
    {
      email: "example@pickrate.gg",
      password: '123456',
    },
  ]);
  await r6.init();

  // if you ever see me in game, please don't spawn peek me
  const { profileId } = await r6.getPlayer("FledRose0", SearchPlatform.pc);
  console.log(profileId);
  const { xp } = await r6.getProgression(profileId, Platform.pc);
  console.log(xp);
  const { mmr } = await r6.getRank(
    profileId,
    Platform.pc,
    Mode.ranked,
    Region.na,
    -1
  );
  console.log(mmr);
  const {
    profile: {
      general: { kills },
    },
  } = await r6.getStats(profileId, Platform.pc, allStats);
  console.log(kills);
  // don't spawn peek this guy either
  const { profileId: profileId2 } = await r6.getPlayer(
    "FledRoseO",
    SearchPlatform.pc
  );
  const bulk = await r6.getBulkStats(
    [profileId, profileId2],
    Platform.pc,
    allStats
  );
  console.log(bulk[profileId].profile.casual, bulk[profileId2].profile.casual);
})();

```

# Overview

This SDK is designed as a light wrapper around the Ubisoft APIs will full support for all of the stats endpoints and parameters as well as bulk queries.

It only supports PVP (we're yet to see a compelling use case for PVE data) and does not add additional metadata to API responses. The focus of this SDK is handling authentication, load balancing across keys, and cleaning up the response from the API.

# API

## new Siege()

```ts
constructor(credentials: CredentialSet[]): Siege
```

Creates an API client which rotates between the provided credential sets.

## Siege.init()

```ts
async init(): Promise<void>
```

Performs initial setup (authentication).

## Siege.search()

```ts
async search(query: string, platform: SearchPlatform): Promise<PlayerProfile[] | null>
```

Searches for players by name.
  * `query` - the search term
  * `platform` - platform to search

## Siege.getPlayer()

```ts
async getPlayer(name: string, platform: SearchPlatform): Promise<PlayerProfile | null>
```

Wrapper around Siege.search. `name` must be an exact match.

## Siege.getProgressions()

```ts
async getProgressions(profiles: string[], platform: Platform): Promise<{ [profileId: string]: ProfileProgression } | null>
```

Gets players' progression in game.
  * `profiles` - profiles to get progression for
  * `platform` - platform to get progression on

## Siege.getProgression()

```ts
async getProgression(profile: string, platform: Platform): Promise<ProfileProgression | null>
```

Wrapper around Siege.getProgressions().

## Siege.getRanks()

```ts
async getRanks(profiles: string[], platform: Platform, board: Mode, region: Region, season: number): Promise<null | { [profileId: string]: ProfileRank }>
```

Get players' rank in game.
  * `profiles` - profiles to get ranks for
  * `platform` - platform for stats
  * `board` - game mode for rank
  * `region` - region for rank
  * `season` - season for rank 

## Siege.getRank()

```ts
async getRanks(profile: string, platform: Platform, board: Mode, region: Region, season: number): Promise<null | ProfileRank>
```

Wrapper around Siege.getRanks().

### Siege.getBulkStats()

```ts
async getBulkStats(profiles: string[], platform: Platform, stats: Statistic[]): Promise<null | { [profileId: string]: ProfileStats }>
```

Retrieves requested stats for all profiles
  * `profiles` - profiles to get stats for
  * `platform` - platform to get stats on
  * `stats` - stats to get


### Siege.getStats()

```ts
async getBulkStats(profile: string, platform: Platform, stats: Statistic[]): Promise<null | ProfileStats>
```

Retrieves requested stats for all profiles
  * `profiles` - profiles to get stats for
  * `platform` - platform to get stats on
  * `stats` - stats to get

## Enums

To prevent typos and make code more readable, enums are available for some parameters.

### SearchPlatform

A profile platform.

Possible values:
  * `SearchPlatform.pc`
  * `SearchPlatform.steam`
  * `SearchPlatform.xbox`
  * `SearchPlatform.playstation`
  * `SearchPlatform.twitch`

## Platform

A gameplay platform.

Possible values:
  * `Platform.pc`
  * `Platform.xbox`
  * `Platform.playstation`

### Region

A gameplay region.

Possible values:
  * `Region.na`
  * `Region.europe`
  * `Region.asia`

### Mode

A major game mode.

Possible values:
  * `Mode.casual`
  * `Mode.ranked`

### Statistic

A supported statistic.

There are over 100 supported statistics. 
Please refer directly to the source code or typings for the latest list.

You can import `allStats` if you want the entire list.

# Development

## Available Scripts

In the project directory, you can run:

### `npm run build`

Builds the package using typescript into `./lib`

### `npm test`

Launches the Jest to run tests.

### `npm run lint`

Checks code for style issues and syntax errors with TSLint and Prettier.

### `npm run lint:fix`

Checks code for style issues and syntax errors with TSLint and Prettier, attempting to fix them when possible.

## Publishing a new version

Travis is configured to run deploys on tags.

## Credit

[danielwerg/r6api.js](https://github.com/danielwerg/r6api.js) was used as a reference for understanding the authentication process.
