---
title: Make and publish a plugin
description: Start a plugin from the example, try it in Studio before releasing it, and list it in the catalog.
sidebar:
  order: 3
---

A plugin teaches Studio new tricks: blocks, value editors, windows of its own, overlays while a program runs,
assistant tools. The [Plugins](/plugins/) page shows what each kind looks like. This guide gets one from nothing to
listed. You need Java (JDK 25 or newer), Maven and `gh`; `botmaker doctor` checks all three.

## 1. Start from the example

```bash
botmaker plugin new discord-notifier
cd discord-notifier
```

That creates a working plugin project from the example plugin. Every value has a default derived from the name;
the ones you are likely to change:

| Option | What it sets | Default |
|---|---|---|
| `--group` | the Maven `groupId` | `com.example` |
| `--package` | the Java package | `<group>.<name without punctuation>` |
| `--plugin-id` | the plugin's id, unique in the catalog | `<group>.<name>` |
| `--plugin-name` | the name a user reads | the name, titled |

Put the project in its own GitHub repository: the catalog lists plugins by repository.

## 2. Check it

```bash
botmaker plugin validate
```

This runs the checks the catalog runs on a plugin. A local pass is not a promise: two of the checks ask whether an
id is already taken, which only the catalog can answer.

## 3. Try it in Studio

Either let the command do it:

```bash
botmaker plugin run --project MyBot   # builds, adds it to ~/BotMakerProjects/MyBot, opens Studio
```

or do it by hand: run `mvn install`, open a project in Studio, and in **Project ▸ Plugins & Libraries…** tick
**Dev mode**. Studio then loads development builds from your computer's Maven repository and offers yours as
*(local build)*. After each rebuild, press **Reload** to pick it up. Dev mode is per project and on this computer
only; nothing is released.

## 4. Publish it

In the plugin's folder, with everything committed and pushed:

```bash
botmaker plugin publish           # the next patch release
botmaker plugin publish minor     # or minor, or major
botmaker plugin publish --dry-run # the checks and the entry, nothing tagged
```

It checks the plugin, tags and releases the next version, waits for JitPack to build it, checks the jar, and opens
the pull request that lists it in the [catalog](/docs/explanation/catalog/). The catalog merges it when the same
checks pass there. Studio users can then add it in **Plugins & Libraries**; until your account is ranked, Studio
asks each of them before it first loads your plugin.

To stop listing it: `botmaker plugin unpublish --id <plugin-id>`, or `--release <tag>` for one release only.
