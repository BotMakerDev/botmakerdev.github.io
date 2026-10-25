---
title: Run a bot
description: Download a bot's .bmk file from the Gallery and run it in BotMaker, without editing anything.
sidebar:
  order: 3
---

A published bot comes as one file, `<name>-<version>.bmk`. Open it in BotMaker and the bot shows in **My bots**,
ready to run. You do not need to edit it, or to know Java.

## Before you start

[Install BotMaker](/install/). The `.bmk` holds the bot's sources and the libraries it runs with; the parts that
depend on your system (screen capture, reading text, mouse and keyboard) come from the installed BotMaker. The same
file opens on Linux, Windows and macOS.

## Get the file

In the [Gallery](/gallery/), a bot whose author published a file has a **Download** button. A bot without one was
released without a file: start a project from it in Studio instead (**＋ New bot**, then the bot). When the author
deleted the release, its card says "This release is no longer available."

## Open it

BotMaker opens on the bot list. Drop the `.bmk` anywhere on it, or start BotMaker with the file:

```bash
botmaker-studio --open=firestone-1.0.0.bmk
```

Before anything runs, the file is checked:

- **A bot the catalog lists**: the file must be the one the catalog approved for that release. The catalog rebuilt
  it from the author's commit and kept its fingerprint (a sha256); a file that differs is refused, with the reason.
  Each library inside is checked against the list the file carries.
- **A file the catalog does not list** (shared privately, or someone's unpublished bot) still opens, after a
  stronger warning: nobody checked it.

The first time you open a bot by an author, a sheet asks first: "“Firestone” by its author (Community) runs code on
this computer." Choose **Run it** only for a bot you trust; a bot can do anything a program on your computer can.
For a bot the catalog lists, BotMaker remembers your answer for its later versions; an unlisted file asks each
time.

## Run it

The bot then shows in **My bots**. **▶ Run** opens its Run window: the settings its author offers, the bot's
status ("Ready — game window found"), and **▶ Start**. Press **Pause** (F12 on a Mac) to stop it. The values you
set are kept, and applied again when you open a newer version of the same bot.

To change the bot, choose **Edit in Studio** on its card. BotMaker gets the author's project at that version,
linked to them, so their later versions can still be merged in.

## Where it is kept

An opened bot is unpacked into BotMaker's data folder, one folder per version, for running only. **Remove** on its
card deletes it; its settings stay, and opening its file again brings it back.
