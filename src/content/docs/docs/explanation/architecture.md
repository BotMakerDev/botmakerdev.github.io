---
title: How BotMaker fits together
description: The parts of BotMaker, what each one does, and how a program goes from blocks to a run.
sidebar:
  order: 0
---

BotMaker is a block editor for Java. You build a program from blocks in **Studio**; the program is an ordinary
Java project on your disk; **plugins** teach Studio new kinds of blocks and values, and the **SDK** plugin turns it
into a workshop for bots that play games. This page is the map: which part does what, and how they talk.

## The parts

```text
                 you                         an AI assistant (Claude Code, Codex, …)
                  │                                   │ MCP tools
                  ▼                                   ▼
          ┌──────────────┐   edits, events   ┌──────────────────┐
          │    Studio    │ ◀───────────────▶ │       core       │
          │  JavaFX app  │                   │ headless process │
          └──────────────┘                   └──────────────────┘
                                               │      │       │
                          reads and writes Java│      │loads  │starts and watches
                                               ▼      ▼       ▼
                                  your project   plugins    a run of your bot
                                  (Maven, Java)  (jars)     (its own JVM, run log)
```

| Part | What it is |
|---|---|
| **Studio** | The window you work in: the bot list, the block canvas, the windows plugins add, runs and their reports. It is a client: everything it changes, it asks the core to change. |
| **core** | The process that owns an open bot. It reads and edits the Java, compiles it, keeps its history, loads its plugins, starts runs and records them. It also serves the tools an AI assistant uses, so you and an assistant edit the same bot through the same checks. |
| **botmaker-java** | Reads and writes a bot's Java as syntax trees, with Eclipse JDT, the compiler toolkit an IDE uses. Blocks are drawn from those trees, and an edit is a change to the tree, never text pasted into a file. |
| **The plugin contract** | The interfaces a plugin implements: its blocks, value editors, toolbar items, windows, assistant tools and runs. A host loads plugins through `botmaker-plugin-host`; plugins build their windows with `botmaker-plugin-toolkit`. |
| **SDK** | Plugin number one, and the runtime a game bot runs on: screen capture, finding pictures, reading text, clicking and typing, a map of the game's screens, goals and plans, and the run overlay. |
| **Basics** | A small plugin with editors for everyday Java values: durations, times, dates, colours. |
| **Run log and reports** | Each run writes a `run.jsonl`; Studio's *Reports* and the `botmaker reports` command read it back as charts and issues. |
| **`botmaker` command** | Creates and publishes plugins and bots, checks catalog entries, and bridges an AI assistant to a running core. |
| **Catalog** | One list of published bots and plugins, each release pinned by commit and checksum. A machine checks every listing; Studio's *Get more bots* and this site's Gallery read it. |

## From a block to a run

1. **You add a block.** Studio sends the edit to the core. The core changes the syntax tree of the file, writes the
   file, compiles it, and answers with the methods it reshaped. Studio redraws them.
2. **You edit the file elsewhere.** The core sees the change on disk and Studio redraws it as blocks. There is no
   second copy of the program to fall out of step; see [Blocks are Java](/docs/explanation/blocks-are-java/).
3. **You press ▶ Run.** The core compiles the project against the libraries its `pom.xml` names and starts it in
   its own Java process. A small
   agent inside that process writes the run log and keeps a line open to the core, so Studio can show the output,
   stop the run, and, for a game bot, draw what the SDK sees on top of the game.
4. **The run ends.** Its log stays with the bot. Studio offers a report: what happened, what went wrong, and what
   the plugins counted.

## Plugins and values

A plugin is one jar, named by its Maven coordinate. It never rewrites your code freely: the values it owns, such as
the SDK's pictures and screens, are Java constants in classes of their own, marked with the plugin's annotation, and
it changes only the expression of such a value. See [Values are Java](/docs/explanation/values-are-java/).

A bot's **parameters**, the values whoever runs it sets, are Java too, in a `params` package that stays on that
computer and is never published. The bot ships its starting values beside it.

<figure class="shot">
  <img class="only-light" src="/shots/params-light.webp" alt="The Parameters window: filters by when a value can change and where it comes from, then cards of parameters grouped by their class, each with its type and value." loading="lazy" />
  <img class="only-dark" src="/shots/params-dark.webp" alt="" loading="lazy" />
  <figcaption>A game bot's <b>Parameters</b>: the bot's own and the SDK's, each group a class, each card one method.</figcaption>
</figure>

When a plugin's new release reshapes a value, Studio's upgrade repairs the bot's code, as described in
[How upgrades repair a program](/docs/explanation/upgrades/).

## Built with

Java 25 and JavaFX for Studio and the core; Maven for every project, yours included; Eclipse JDT for reading and
writing Java; OpenCV for finding pictures on the screen; JitPack to serve the libraries a bot depends on; Astro and
Starlight for this site. Every part is its own repository under
[BotMakerDev on GitHub](https://github.com/BotMakerDev).
