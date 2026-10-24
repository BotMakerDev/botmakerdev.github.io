---
title: Publish a bot
description: Release your bot and list it in the catalog, from the command line or from Studio.
sidebar:
  order: 2
---

Publishing makes a release of your bot on GitHub and lists it in the [catalog](/docs/explanation/catalog/). From
then on it shows in the [Gallery](/gallery/) and in Studio's New Project, and anybody can start a project from it.

## Before you start

- The bot uses at least one plugin from the catalog (the [SDK](/plugins/com.botmaker.sdk/), for a game bot). A
  program that declares none is not a bot the catalog lists.
- The project compiles and a class holds `main`.
- You are signed in to GitHub with `gh` (`gh auth login`). `botmaker doctor` checks this and the other tools.

## From the command line

In the bot's folder, with everything committed:

```bash
botmaker bot publish            # the next patch release: v0.1.0 the first time
botmaker bot publish minor      # or minor, or major
botmaker bot publish --dry-run  # the checks and the entry it would list; nothing is created or tagged
```

The command:

1. checks that a catalog plugin is declared, that the bot compiles and that a class holds `main`;
2. uses the folder's GitHub repository, or creates one named after the folder when it has none;
3. tags the next version, makes the GitHub Release, and opens one pull request in the catalog listing that
   release.

The catalog runs the same checks on the pull request and merges it when they pass. Nobody reviews it by hand.
Every later publish adds its release to your entry, and the earlier ones stay listed.

## From Studio

Choose **Project ▸ Publish to Gallery…**. It runs the same steps as the command, with a sheet that shows each one.

## A bot you started from someone else's

If you started from a published bot, your project is a copy linked to its author. Save it to your own copy on
GitHub first; publishing it then lists your copy as a bot of its own, shown as "based on" the original, and the
author's later versions can still be merged in.

## Stop listing it

```bash
botmaker bot unpublish --repo you/your-bot                    # the whole entry
botmaker bot unpublish --repo you/your-bot --release v0.2.0   # one release; the others stay
```

Each opens the pull request that changes your entry. Your repository and its releases are left as they are.
