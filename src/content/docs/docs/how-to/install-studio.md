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

  On Arch, `yay -S botmaker-studio-bin` from the AUR. Either way, Studio then updates with your system
  (`sudo dnf upgrade`, `sudo apt upgrade`, `yay -Syu`). Any other distribution takes the AppImage, which needs
  no root and updates itself from inside Studio.
- **Windows** and **macOS:** the installer from Studio's latest release.

Studio bundles its own Java and JavaFX, so there is nothing else to install. The same page lists the other tools:
the `botmaker` command, the dashboard, and the phone apps.

Next: [your first program](/docs/tutorials/first-program/).
