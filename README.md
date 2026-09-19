# botmakerdev.github.io

The organization's front page: <https://botmakerdev.github.io/>. One card per installable thing —
Studio, the `botmaker` CLI, the dashboard, remote-server, the two Android apps — plus the two data
repositories as *what is published*.

It exists because every project already has its own Pages site and all of them are findable only if
you already know the repository name. Its first card installs **everything at once** — every BotMaker
repository added, then all four packages in one `dnf install` or `apt-get install`, with the upgrade
commands beside them.

## It is also the stylesheet for the project pages

`assets/style.css` and `assets/copy.js` are linked by the four project pages as well, each of which
generates its own HTML from its own `build-repo.sh`. They are served from this same origin — every
project site is a path under `botmakerdev.github.io` — so linking them costs no availability those
pages did not already have, and the look is one file instead of five copies that drift. The
stylesheet therefore covers **both** markups: the hero and card grid here, and a project page's plain
column. A project page picks up a change at its next release, since that is when its HTML is written.

## What this repository is not

**It does not replace a project's own page.** `botmaker-cli`, `botmaker-studio`, `botmaker-dashboard`
and `botmaker-remote-server` each publish their own site from their own `build-repo.sh`, carrying the
dnf and apt repositories themselves, the signing key and the checksums. Those addresses are installed
on people's machines. Nothing here moves them; this page links to them.

So this repository repeats **no snippet it cannot regenerate**. The one-line `dnf install` on each
card is derived from the address every `build-repo.sh` publishes (`<pages>/<package>.repo`); apt, the
key and everything longer stay on the project page, where they are generated beside the artifact they
describe.

## Editing it

`catalog.json` is the whole content: one object per card. A **version is never written there** — the
generator asks GitHub for each repository's latest release, because a version typed into HTML is
wrong the day after the next release and being right about versions is this page's only job.

```bash
tools/build-site.sh     # writes index.html; needs gh (authenticated) and jq
tools/check-links.sh    # fetches every address the page names, including the ones in the snippets
```

Both run in CI on every push, daily at 06:17 UTC, and on demand (*Actions ▸ pages ▸ Run workflow*).
The daily run is what keeps the page current when a release lands in a different repository. A failed
fetch fails the job and deploys nothing, so the page already published — correct as of its own run —
stays up.

`index.html` is generated and committed, so a fresh clone and a Pages deploy that never ran still
serve something.

## Where it sits

A submodule of [`BotMakerDev/botmaker`](https://github.com/BotMakerDev/botmaker), like every other
repository here, and not in its Maven reactor (there is no pom).
