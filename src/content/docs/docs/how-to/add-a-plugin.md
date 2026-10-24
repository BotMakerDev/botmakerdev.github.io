---
title: Add a plugin to a project
description: Find a plugin, add it to a project, and keep it up to date.
sidebar:
  order: 4
---

Everything about a project's plugins is in one window: **Project ▸ Plugins & Libraries…**. Its three tabs are
**Installed** (what the project uses), **Browse** (what the catalog lists) and **Libraries** (ordinary Maven
dependencies). The [Plugins](/plugins/) page says what each plugin brings.

## Add one

1. Open **Project ▸ Plugins & Libraries…** and choose the **Browse** tab.
2. Find the plugin. The search field filters the list, and each row carries its publisher's rank. Plugins from
   community publishers are hidden until you tick **Show community bots and plugins**; the tick is remembered on
   this computer.
3. Press **Install**.

A row already in the project says **Installed — manage…** instead, and one that another plugin brings with it says
**Installed with another plugin — view…**. The SDK, for one, brings Basics: there is nothing to add for it.

The catalog checks by machine that each plugin loads; nobody reviews one for safety, and a plugin runs with
Studio's own permissions. So the first time a community plugin would load on this computer, Studio asks **Run this
plugin?**. **Don't load it** leaves it in the project, unloaded. The [catalog page](/docs/explanation/catalog/)
explains the ranks.

A plugin is an ordinary Maven dependency in the project's `pom.xml`. Studio writes it for you; if you edit the pom
yourself, Studio picks the change up on its own.

## Upgrade one

The **Installed** tab lists every plugin with its installed version and whether it loaded. A row with a newer
release offers **Upgrade to** it; its version list also offers older releases. **Upgrade all** moves every row that
can move, in one pass.

Each move saves a version of the project first, then repairs the bot's code for the new release: what that repair
does is in [How upgrades repair a program](/docs/explanation/upgrades/). When the repair had to guess, **Open
Review tab** shows what it guessed. When the new release would drop values the bot holds, Studio asks first:
**Migrate first** carries them over with your own rules, **Upgrade anyway** repairs them as best it can.

## Remove one

Press **Remove…** on the plugin's row. Studio first reads what the removal would break and says so on the row,
*nothing breaks* or how many uses are broken, then asks before it writes anything. It saves a version, migrates
the uses it can, removes the plugin from the pom and, if you agree, deletes the files the plugin kept for the bot.
The uses left over are marked for review. The previous state is one restore away in **Project ▸ Versions**.

## When a plugin does not load

The window's header says which plugins did not load and why. **Reload plugins** loads them again, for instance
after the jar changed. A development build (a version ending in `-SNAPSHOT`) loads only when the project is in
**Dev mode**, the box at the bottom of the window: see [Make and publish a plugin](/docs/how-to/make-a-plugin/).
