---
title: Install Studio
description: Where to get Studio for Linux, Windows or macOS.
sidebar:
  order: 1
---

The [install page](/install/) has the steps for your system, with the current version and the exact command or
download. It picks your system for you; the others are a tab away.

- **Linux:** one command for Fedora, RHEL, Debian and Ubuntu, which adds BotMaker's `dnf` or `apt` repositories and
  installs Studio with the `botmaker` command it needs:

  ```sh
  curl -fsSL https://botmakerdev.github.io/botmaker-studio/install.sh | sudo bash
  ```

  Studio then updates with your system (`sudo dnf upgrade`, `sudo apt upgrade`). On Arch, the install page shows
  the AUR command once the AUR lists Studio. Any other distribution takes the AppImage, which needs no root and
  updates itself from inside Studio.
- **Windows** and **macOS:** the installer from Studio's latest release.

Studio bundles its own Java and JavaFX, so there is nothing else to install. The same page lists the other tools:
the `botmaker` command, the dashboard, and the phone apps.

## Use BotMaker from Claude Code

BotMaker's MCP tools are also a Claude Code plugin. They give you your bots and their runs, plus the Android
emulators on your computer (list, start, install a game, screenshot, tap), with or without Studio open:

```sh
claude plugin marketplace add BotMakerDev/botmaker-claude-plugin
claude plugin install botmaker@botmaker
```

The plugin needs Java 25 or newer: `$BOTMAKER_JAVA`, `$JAVA_HOME` or `java` on your `PATH`. On first use it fetches
the `botmaker` command's jar and checks its sha256.

Next: [your first program](/docs/tutorials/first-program/).
