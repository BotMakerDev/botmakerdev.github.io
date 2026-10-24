# botmakerdev.github.io

The BotMaker website: <https://botmakerdev.github.io/>. Home (with a demo editor), Install, Plugins,
Gallery and the docs, in one Astro site. Design: the umbrella's
`docs/superpowers/specs/2026-10-24-website-design.md`; plan: `docs/superpowers/plans/2026-10-24-website.md`.

## Building it

```bash
npm ci
npm test              # node --test over test/*.test.mjs
npm run dev           # http://localhost:4321/
npm run build         # writes dist/
tools/check-links.sh dist
```

CI (`.github/workflows/pages.yml`) runs the same on every push, daily at 06:17 UTC, and on demand
(*Actions ▸ pages ▸ Run workflow*), then deploys `dist/`. The daily run is what keeps versions current
when a release lands in a different repository. A failed fetch fails the job and deploys nothing, so the
site already published — correct as of its own run — stays up.

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
