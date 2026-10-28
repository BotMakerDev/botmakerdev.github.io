# botmakerdev.github.io

The BotMaker website: <https://botmakerdev.github.io/>. Home (with a demo editor), Install, Plugins,
Gallery and the docs, in one Astro site. Design: the umbrella's
`docs/superpowers/specs/2026-10-24-website-design.md`; plan: `docs/superpowers/plans/2026-10-24-website.md`.

## Building it

```bash
npm ci
npm test                       # node --test over test/*.test.mjs
node tools/check-contrast.mjs  # every text colour AA in both looks, from tokens.css
npm run dev                    # http://localhost:4321/
npm run build                  # writes dist/
npx astro preview              # serves dist/ at http://localhost:4321/
tools/check-links.sh dist
```

`CATALOG_FILE=test/fixtures/catalog-v5.json npm run build` reads a local catalog instead of
botmaker-catalog's `main`, for a preview while the live one is not schema 5 yet. After a change to how code
blocks render (Expressive Code), build clean: `rm -rf dist .astro node_modules/.astro` first, or a stale content
cache keeps the old renders and their stylesheet 404s.

CI (`.github/workflows/pages.yml`) runs, in order: the tests, the contrast check, the build, the check that
nothing is emitted under a project site's path (`test/reserved-paths.test.mjs`) and the link check, which
fetches every address the pages name, the install snippets' and the Download buttons' included. It runs on
every push, daily at 06:17 UTC, and on demand (*Actions ▸ pages ▸ Run workflow*), then deploys `dist/`. The daily run is what keeps versions current
when a release lands in a different repository. A failed fetch fails the job and deploys nothing, so the
site already published — correct as of its own run — stays up.

## Where the data comes from

- `src/data/tools.json`: the tools `/install/` lists, the only file to edit when that changes.
- `src/lib/versions.mjs`: each tool's version, from its repository's latest GitHub release.
- `src/lib/tools.mjs`: the dnf, apt and download snippets, derived from the addresses every project page
  publishes, the Download buttons' release files (`downloads` in `tools.json`), and the check that one key
  signs every packaged repository.
- `src/lib/catalog.mjs`: botmaker-catalog's `catalog.json`, schema 4 only. Another schema shows as "the
  catalog could not be read"; a catalog that does not answer fails the build.

## Two looks

`src/styles/tokens.css` holds both: "Manual" in light (warm paper, ink, Fraunces, one orange, square
corners) and "Dark editor" in dark (charcoal, Space Grotesk, syntax colours, yellow accent). The system
setting picks one; the header toggle overrides it and is remembered under the same `localStorage` key
Starlight uses (`src/lib/theme.mjs`), so the docs follow the same choice. Fonts are self-hosted
(`@fontsource`): the site makes no third-party request.

## It is also the stylesheet for the project pages

`public/assets/style.css` and `public/assets/copy.js` are served at `/assets/style.css` and
`/assets/copy.js`, and the four project pages link them, each generating its own HTML from its own
`build-repo.sh`. The stylesheet covers **both** markups: a hero and card grid, and a project page's
plain column. Do not remove a rule because this site does not use it.

## What this repository is not

**It does not replace a project's own page.** `botmaker-cli`, `botmaker-studio`, `botmaker-dashboard`
and `botmaker-remote-server` each publish their own site at `/<repo>/` on this origin, carrying the dnf
and apt repositories, the signing key and the checksums. Those addresses are installed on people's
machines, so this site emits nothing under them (`test/reserved-paths.test.mjs`, run in CI after the
build).

So this repository repeats **no snippet it cannot regenerate**, and **types no version**: versions are
fetched from each repository's latest GitHub release at build time.

## Where it sits

A submodule of [`BotMakerDev/botmaker`](https://github.com/BotMakerDev/botmaker), like every other
repository here, and not in its Maven reactor (there is no pom).
