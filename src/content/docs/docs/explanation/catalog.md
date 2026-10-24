---
title: The catalog, ranks and pinned releases
description: How bots and plugins get listed, what the checks do and do not promise, and why every release is pinned.
sidebar:
  order: 2
---

The [catalog](https://github.com/BotMakerDev/botmaker-catalog) is the list of published bots and plugins: the
[Gallery](/gallery/), the [Plugins](/plugins/) page, Studio's New Project and its *Plugins & Libraries* all read it.
It is **checked by a machine and merged by a machine**. That makes listing fast and fair; it also means a listing
is never a security claim.

## What is checked, and what is not

A bot is a Java program and a plugin runs inside Studio's own process. Every check asks two things: does the entry
*work*, and does its author *control* the repository it names. None asks whether the code is *safe*, and none
could. Run a bot or a plugin the way you would run any other program somebody wrote.

For a release to be listed, its pull request must change exactly one entry, its author must have made the GitHub
Release it names (or, for a release a GitHub Action made, own the repository), and that release must be published
(not a draft or a prerelease). Then:

- **a bot** must declare a catalog plugin at a released version, compile, and have a `main`;
- **a plugin** must pass the same checks as `botmaker plugin validate`, its jar must carry the entry's id, and
  JitPack must serve it.

## An entry holds only your decisions

An entry is one small file: which repository, and which releases. Everything else you see — the name, the
description, stars, the "based on" of a fork — is read from GitHub. You change your entry only by publishing or
unpublishing (`botmaker bot publish`, Studio's Publish, `botmaker plugin publish`), each of which opens a pull
request changing that one file. Only whoever controls the repository today, or an admin, may change or remove it.

## Every release, pinned

The catalog keeps every release it approved, not only the newest. Each is **pinned**: the commit its tag pointed to
when it was approved and, for a plugin, the fingerprint (SHA-256) of the jar and the pom JitPack served then. If a
tag is moved or a jar is rebuilt afterwards, it no longer matches, and Studio refuses it. What you saw approved is
what you get.

## Ranks

Every entry shows one of three ranks, taken from its repository's current owner:

- **Official** — BotMaker's own (the catalog's admins);
- **Trusted** — accounts the admins have listed;
- **Community** — everyone else.

A fork takes its owner's rank, and a repository moved to a new owner takes theirs. Studio asks before it first
loads a community plugin on a computer.
