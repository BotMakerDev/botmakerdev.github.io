---
title: Read your bot's reports
description: See where your bot fails for the people who run it, and on your own computer, in Studio's Reports tab or with botmaker reports.
sidebar:
  order: 8
---

A bot that gets stuck for someone else usually fails without a word. BotMaker keeps a log of each run and, with the
runner's consent, turns its problems into issues on the bot's GitHub repository. The Reports tab reads both.

## What a run keeps

Each run writes a log in the bot's `target/botmaker-runs/<run>/run.jsonl`. Every line has a level:

- **Info**: the bot's own code handled it (a way that was not open now, a locked screen).
- **Warning**: a fallback rescued the run (a walk got stuck and the run recovered).
- **Error**: nothing handled it (the map names a picture the game no longer shows).

Only warnings and errors are problems. With debugging off, the log keeps the last 50 lines before each problem, so
a problem comes with what led to it.

## What the runner sends

When a run ends with problems, BotMaker shows them in one dialog: each problem ticked on the left, the exact text it
sends on the right, which the runner can edit. What the game showed on screen is left out, and so are the runner's
home folder and user name. The runner picks **Ask each time**, **Always send** or **Never** for the bot, then
**Send**, **Later** or **Export logs…**. A problem sent once becomes an issue on the bot's repository; the same
problem again becomes a comment on it. Sending needs a GitHub sign-in (top right of Studio's main window). A run's
problems can be sent later from the Trace tab's **Submit logs…**.

## Read them in Studio

Open the bot and pick the **Reports** tab at the bottom. Choose where to read from: **Issues on GitHub** (every
runner's reports) or **Runs on this computer** (your own runs). Then:

- **Group by** picks what to count problems by: the bot's line, the called method, the level, the bot version, a
  run detail (the flow, the platform, the game's version) or a value a plugin adds.
- **Chart** draws it as **Bars**, **Bars by day**, **Lines**, a **Heatmap**, a **Donut** or a **Table**.
- Click a value in the chart to list its problems, with when each was first and last seen.

### A plugin's views

A plugin can add ready-made views, picked in **View**. A view sets the chart and what it counts. The SDK adds four:

- **Problems per screen**: the screen the game was on at each problem.
- **Failed moves**: walks that got stuck or failed, from which screen to which.
- **Unrecognised screens**: where the bot was going when the game showed none of the map's screens. A long row here
  usually means a screen is missing from the map, or its markers no longer match.
- **Time on screens**: how long your runs stayed on each screen. It reads your own runs only (**Runs on this
  computer**): reports sent to GitHub carry problems, not time.

When the reports picked carry none of what a view counts, the chart says so.

## Read them in a terminal

In the bot's folder:

```bash
botmaker reports                      # the issues on the bot's repository, by bot line
botmaker reports --group-by plugin.screen --level error
botmaker reports --run target/botmaker-runs    # your own runs' logs
```

`--since yyyy-mm-dd` keeps the problems from that day on, and `--json` answers in JSON. The issues are cached in
`~/.cache/botmaker/reports`.
