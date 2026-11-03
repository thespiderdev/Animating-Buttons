# Button imports

The local catalogue currently includes 1,231 examples from the official `uiverse-io/galaxy` Buttons archive and 615 React examples from 35 public upstream libraries by 21st creators. Import reports are stored beside the source files in `public/imported-buttons/`. Neither report claims complete coverage of the live websites or the full 21st catalogue.

Run the importers from the project root after installing dependencies and cloning the upstream repositories:

```sh
node scripts/imports/uiverse.mjs /path/to/galaxy/Buttons
node scripts/imports/magicui.mjs /path/to/magicui/apps/www
node scripts/imports/react-upstreams.mjs /path/to/checkouts
# Rebuild one source only:
node scripts/imports/react-upstreams.mjs /path/to/checkouts sean0205
```

The Magic UI checkout must include `registry/magicui`, `registry/example`, and `public/r` under `apps/www`. The importers parse or compile source without executing third-party component code on the server. Tailwind styles and React bundles are generated at import time. Source licenses are retained in `licenses/` and `public/imported-buttons/`, and included in downloads.

Each example has a stable ID, creator name, internal provenance, and its own source JSON file. The index contains metadata only. Gallery previews fetch their isolated frame document on demand. Imported examples are local versioned assets; importing does not bulk-write to Firebase or create fake community accounts, likes, or GitHub profiles.

`addedAt` records when an example entered this project and survives subsequent imports. Server pagination and the gallery both use it for the default latest-first order. The field does not claim an upstream publication date.

Provider badges, promotional links, and provider attribution comments are omitted from the interface and editable examples. Creator names remain visible. An author with only a provider profile is credited as plain text; an available upstream GitHub link remains clickable.

React pages provide a live preview, selectable source files, copy, save, and download. They do not expose the HTML editor as an editable React environment. Downloads include a standalone compiled example, original TSX files, dependencies, creator credit, and the applicable license.

The 21st CLI has not been used to retrieve components or consume daily downloads. Remaining 21st examples require additional public upstream source repositories or an authorized bulk source export/API. The public archive also contains fewer examples than the live button catalogue; adding every live example remains incomplete.

## React source coverage

These are upstream examples and variants, not a claim that every 21st listing has been imported one for one. The matching public checkouts must be named `animating-buttons-upstream-<repository-name>` inside the supplied directory. Source repositories, demo selectors, and import adapters are defined in `scripts/imports/react-upstreams.mjs`. The report records the exact upstream Git commit, imported IDs, exclusions, and compilation errors.

| Creator         | Examples |
| --------------- | -------: |
| Ali Imam        |        7 |
| badtz           |        8 |
| Bidyut          |       20 |
| Bundui          |       19 |
| Clevision       |       63 |
| Cnippet         |       30 |
| crysta1221      |        5 |
| cult/ui         |       10 |
| Dillion Verma   |        9 |
| Edwin Vakayil   |        5 |
| Elliot Sutton   |        7 |
| Hyperiux Vault  |        5 |
| James Shopland  |       20 |
| jay sharma      |       30 |
| John Mamanao    |       16 |
| kevingirelli    |        1 |
| Kokonut UI      |       13 |
| Lucas Bassetti  |        8 |
| Moumen Soliman  |       20 |
| Origin UI       |       40 |
| Preet Suthar    |       15 |
| Prism UI        |        3 |
| purnavu-12      |        7 |
| Ruixen          |       13 |
| Rushil Dhinoja  |        3 |
| Samuel Breznjak |       11 |
| Saurabh         |        7 |
| Saurabh Sharma  |        3 |
| Sean Hello      |      109 |
| shadcn          |       20 |
| ShadcnSpace     |       47 |
| UI Layouts      |       20 |
| Voxlet UI       |        4 |
| Özer            |        6 |
| tom             |       11 |

The importer resolves ReUI’s site-specific icon placeholders to their actual named Lucide icons, with the GitHub brand glyph from Remix Icon. Two UI Layouts demos use semantic button elements in place of clickable divs. Monorepo import aliases are adapted to the downloaded source files. Iconiq examples use small local demo wrappers around its unchanged public button implementations. None of these adapters introduce a substitute button design.

Preview URLs include a content hash so rebuilt bundles do not keep showing a stale cached preview. Packages needed only to build imports are development dependencies; browser previews contain the compiled code. Each example compiles separately, and package imports retain ESM resolution so unused icon libraries are removed.

To repeat browser smoke checks, run `node scripts/imports/preview-audit.mjs` and open its local URL. The local test page renders 16 isolated product preview documents per numbered page and displays runtime errors, visible control counts, and unwanted form fields. The reviewed results are in `design/reports/react-import-audit.json`. The audit server binds only to localhost and is not an application route.

## Editable source format

React pages open the implementation TSX file first where available; the usage example and helper files remain selectable and are included in downloads. The imported originals come from publisher repositories. Public iframe bundles are compiled JavaScript, and are not labelled or imported as original TSX. The signed-in 21st website also gates its component source behind daily unlocks or membership; CLI authentication does not remove that website limit.

The counts above describe working upstream examples and variants, not verified coverage of 2,043 distinct 21st listings. `scripts/imports/21st-catalogue-manifest.json` records discovered catalogue identities separately, with direct listing links, potential upstream counterparts, and unresolved entries. A matching author/component name does not establish that a current upstream version is identical to the published 21st revision.

Use `IMPORT_AUDIT_PENDING=true node scripts/imports/preview-audit.mjs` to check only new or changed previews against the saved browser results.

## Catalogue discovery and remaining sources

The saved public inventory is separate from the imported examples. The current pass read 991 of the 997 author indexes advertised in the public sitemap, plus button-named sitemap URLs, the public category seed, and earlier metadata searches. It records 678 canonical candidate listing URLs, with four observed demo URLs recorded separately. Of these, 543 have button titles; the others require button-only review or have unavailable metadata. This is a broader discovery set, **not a complete, verified inventory of every category demo**.

The matching report links 101 candidate listings to imported sources: six listing-linked sources and 95 possible publisher counterparts. Among the 543 button-titled listings, 448 still lack an imported source match. Current publisher revisions and examples do not establish identical coverage of 2,043 website results. The website's public category snapshot currently reports a different total; that number is preserved as an observation, not used to manufacture a remaining count.

- [Listing inventory and matching evidence](../scripts/imports/21st-catalogue-manifest.json)
- [Reviewable coverage spreadsheet (CSV)](../scripts/imports/21st-coverage.csv)
- [Public metadata snapshot and failures](../scripts/imports/catalogue/21st-public-snapshot.json)
- [Author indexes and public GitHub/website links](../scripts/imports/catalogue/21st-author-index.json)

To refresh public discovery without component downloads or daily retrieval credits:

```sh
node scripts/imports/catalogue-snapshot.mjs --authors
node scripts/imports/catalogue-manifest.mjs scripts/imports/catalogue/21st-public-snapshot.json
```

Metadata responses are cached in `/tmp/animating-buttons-catalogue-cache`; set `CATALOGUE_CACHE` to keep them elsewhere. The CSV preserves unresolved entries, their public author links, and candidate import IDs. Name matches are labelled as potential counterparts, never verified source revision matches.

The latest batch added 94 examples from nine additional publishers, including original TSX, dependencies, applicable source licenses and creator credits. Nacre's CSS modules are compiled for previews while its original module files remain in downloads. Opensource UI previews are extracted from the publisher's public showcase TSX. GodUI examples include its original theme and animation styles, with small usage wrappers around unchanged button implementations. Non-button switches and form examples are excluded.

Public originals that have not been located remain unresolved. Authenticated 21st source installs still have the account's retrieval limits; this discovery/import pass does not use those installs or convert compiled iframe code into purported original TSX.

Six inspected iframes contained compiled preview bundles without source maps. The Flow Button listing linked to Spell UI, whose public repository supplied 11 original TSX examples and variants. See the [iframe inspection report](../design/reports/21st-iframe-inspection.json).
