# lis-hubs-infra-registry

Part of the Livestock Information Service (LIS), which lets livestock keepers, owners, agents and
delegates record and manage their animals.

`@defra/lis-hubs-infra-registry` is a shared npm package that holds the registry of LIS modules
(the spoke apps, with their paths, ports, species, taxonomies and hubs), plus the supported species
and taxonomies, and small helpers to look them up.

It holds facts only. It does not make permission or capability decisions (see
[lis-hubs-infra-access](https://github.com/DEFRA/lis-hubs-infra-access)).

Used by:

- hubs: [lis-hubs-front-office](https://github.com/DEFRA/lis-hubs-front-office), [lis-hubs-back-office](https://github.com/DEFRA/lis-hubs-back-office)
- spokes: [lis-apps-cattle-home](https://github.com/DEFRA/lis-apps-cattle-home), [lis-apps-cattle-register](https://github.com/DEFRA/lis-apps-cattle-register), [lis-apps-cattle-move](https://github.com/DEFRA/lis-apps-cattle-move), [lis-apps-cattle-death](https://github.com/DEFRA/lis-apps-cattle-death)
- packages: [lis-hubs-infra-core](https://github.com/DEFRA/lis-hubs-infra-core), [lis-hubs-infra-access](https://github.com/DEFRA/lis-hubs-infra-access), [lis-infra-ui-services](https://github.com/DEFRA/lis-infra-ui-services)

It is a peer dependency of lis-hubs-infra-core, lis-hubs-infra-access and lis-infra-ui-services.

## Installation

```bash
npm install @defra/lis-hubs-infra-registry
```

If your app uses one of the packages that lists it as a peer dependency, install it alongside them.

## Usage

All exports come from the package root.

### Constants

```js
import {
  HUBS,
  TAXONOMIES,
  SPECIES,
  MODULES
} from '@defra/lis-hubs-infra-registry'

HUBS // ['front-office', 'back-office']
TAXONOMIES // [{ id: 'register', label: 'Register', summary: '...' }, ...]
SPECIES // [{ id: 'cattle', code: 'ctt', label: 'Cattle', summary: '...' }, ...]
MODULES // every module entry from src/modules.json
```

The supported taxonomies are `register`, `move`, `death`, `status` and `home`. The supported
species are cattle (`ctt`), sheep (`shp`), camlid (`cml`), chicken (`chk`) and goat (`gt`).

### Lookups

Each lookup returns `null` when nothing matches, except `getBasePathForModule`, which throws.

```js
import {
  getTaxonomyById,
  getSpeciesByCode,
  getModuleById,
  getBasePathForModule,
  getModulesForHub,
  hydrateModuleMetadata
} from '@defra/lis-hubs-infra-registry'

getTaxonomyById('move') // { id: 'move', label: 'Move', summary: '...' }
getSpeciesByCode('ctt') // { id: 'cattle', code: 'ctt', label: 'Cattle', ... }
getModuleById('cattle-move') // { id: 'cattle-move', path: '/cattle/move', port: 3204, ... }
getBasePathForModule('cattle-move') // '/cattle/move'; throws if the module is not registered
getModulesForHub('front-office') // every module whose `hubs` includes 'front-office'

hydrateModuleMetadata(getModuleById('cattle-move'))
// the module plus `taxonomyLabel: 'Move'` and `speciesLabel: 'Cattle'`
// (falls back to the raw id or code if there is no match; returns null for null)
```

### Module entries

`src/modules.json` is an array. Each entry has these fields:

| Field      | Type     | Meaning                                                                  |
| ---------- | -------- | ------------------------------------------------------------------------ |
| `id`       | string   | Module id. Matches the spoke's repo name without the `lis-apps-` prefix. |
| `label`    | string   | Name shown to users.                                                     |
| `path`     | string   | URL base path the hub serves the spoke on.                               |
| `port`     | number   | Port the spoke listens on in local development and lis-dev.              |
| `taxonomy` | string   | `id` of an entry in `src/supported-taxonomies.json`.                     |
| `species`  | string   | `code` of an entry in `src/supported-species.json`.                      |
| `hubs`     | string[] | Hubs that serve the module. Each must be one of `HUBS`.                  |

For example:

```json
{
  "id": "cattle-move",
  "label": "Move for Cattle",
  "path": "/cattle/move",
  "port": 3204,
  "taxonomy": "move",
  "species": "ctt",
  "hubs": ["front-office", "back-office"]
}
```

### Adding a module

1. Create the spoke app. Name the repo `lis-apps-<id>`.
2. Add the entry to `src/modules.json`. Use a unique `id`, `path` and `port`.
3. If the species or taxonomy is new, add it to `src/supported-species.json` or
   `src/supported-taxonomies.json` first.
4. Add a compose file for the spoke under `.tools/compose` in
   [lis-dev](https://github.com/DEFRA/lis-dev), published on the same port.
5. Release this package, then bump it in the hubs and other consumers.

The hubs need no route changes. `createProxyPlugin` in
[lis-hubs-infra-core](https://github.com/DEFRA/lis-hubs-infra-core) reads `getModulesForHub` and
adds a proxy route for each module, forwarding to the service `lis-apps-<id>` on its `port` (in
local development) at its `path`. Spokes also read their base path from here through
[lis-infra-ui-services](https://github.com/DEFRA/lis-infra-ui-services).

## Prerequisites

- Node.js 24 (see `.nvmrc`, use `nvm use`)
- To check changes against a consuming app: a local clone of [lis-dev](https://github.com/DEFRA/lis-dev) with its one-time setup done

## Setup

### Development

```bash
nvm use
npm install
```

### Test

There are no tools to install beyond `npm install`. Tests use [Vitest](https://vitest.dev/).

## Running in development

This is a library, so it has no server of its own. To try a change in a consuming app without
publishing, link the local copy into the lis-dev stack:

```bash
cd lis-dev
.bin/sideload link hubs/infra-registry # every installed copy now points at this repo
.bin/sideload up front-office           # optional: run a consumer locally with hot reload
.bin/sideload unlink hubs/infra-registry # when done
```

## Running tests

```bash
npm test                 # unit tests
npm run test:coverage    # with coverage
npm run lint             # ESLint
npm run format:check     # Prettier
```

Before releasing a change, also run the tests of each consuming repo against the linked package.

## Pipelines

Build, versioning and publishing run in GitHub Actions (`.github/workflows`) using Cake scripts (`*.cake`):

- **Pull request to `main`**: validate (format, lint, test), Sonar analysis, version check
- **Push to a `feature/` or `hotfix/` branch**: prerelease version and tag
- **Merge to `main`**: release tag, then publish to [npm](https://www.npmjs.com/package/@defra/lis-hubs-infra-registry)

Versions come from git tags (SemVer). After a merge, wait for the publish job to finish before bumping the package in consuming repos.

## Branching policy

The repo uses mainline development. Branch from `main` and name the branch:

- `feature/LREG-<ticket>-<short-kebab-description>`
- `hotfix/LREG-<ticket>-<short-kebab-description>`

`LREG` must be uppercase, because the GitHub ruleset rejects other branch names. Rebase onto `main`
rather than merging `main` in.

## Contributing to this project

- Follow the [Defra software development standards](https://github.com/DEFRA/software-development-standards).
- `npm install` sets up a pre-commit hook (Husky) that runs the security audit, format check and lint.
- Feature branches bump the minor version and hotfix branches the patch version. While the package is on 0.x, a breaking change to the public API, or to the shape of a module entry, ships as a minor version, so call it out in the PR so consumers can update.
- Open a pull request against `main` using the PR template. CI must pass and the Sonar quality gate must be green before merge.

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government licence v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
