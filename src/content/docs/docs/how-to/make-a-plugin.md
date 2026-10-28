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
| `--owner` | the GitHub account the repository goes under; the `groupId` is `com.github.<owner>` | the account `gh` is signed in to |
| `--package` | the Java package | `com.github.<owner>.<name without punctuation>` |
| `--plugin-name` | the name a user reads (the pom's `<name>`) | the name, titled |
| `--class-prefix` | the start of each class name: `DiscordNotifierPlugin`, `DiscordNotifierTypes`, … | the name in CamelCase, less a trailing `-plugin` |
| `--minimal` | a plugin class that declares nothing yet and its one test, instead of the Greeter example | off |

Next to the sources sit `CHANGELOG.md` and `icon.png`. Studio shows the icon in **Plugins & Libraries** and the
changelog's new sections when a user upgrades your plugin, so keep both current; replace the default puzzle piece
with your own 64-pixel PNG. `DECLARE.md` walks through each kind of thing a plugin can declare.

The plugin's identity is its pom's `groupId:artifactId`, `com.github.<owner>:<name>`: what JitPack serves the
repository `<owner>/<name>` as, so it never changes when you publish. There is no separate id. The pom also says
which class is the plugin, in one property:

```xml
<properties>
    <botmaker.plugin>com.github.somedev.discordnotifier.plugin.DiscordNotifierPlugin</botmaker.plugin>
</properties>
```

Rename or move that class and run `botmaker plugin declare` (or edit the property), or nothing loads; the
project's own test fails `mvn verify` until you do. Put the project in its own GitHub repository named like the folder: the catalog lists plugins by
repository. The project also holds `jitpack.yml` and `.jitpack/`, how JitPack builds it; `plugin publish` keeps
them current, so leave them as they are.

To build against a newer Studio later, `botmaker plugin upgrade` moves the pom's `botmaker-plugin-parent`, which
pins the contract, the toolkit and JavaFX together, to its newest release and checks the plugin again.

## 2. Check it

```bash
botmaker plugin validate
```

This runs the checks the catalog runs on a plugin, among them building every holder class your plugin names, as
Studio does. A missing changelog or icon is a warning, never a failure. A local pass is not a promise: the catalog also checks that the
published pom declares the coordinate JitPack serves for your repository, which only a release can show.

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

To stop listing it: `botmaker plugin unpublish --repo <owner/name>`, or `--release <tag>` for one release only.
