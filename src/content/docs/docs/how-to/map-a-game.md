---
title: Map a game's screens
description: Tell an SDK bot which screen the game shows, what each button does and what its looks mean.
sidebar:
  order: 7
---

A bot made with the [SDK](/plugins/BotMakerDev/botmaker-sdk/) walks its game by a map: its `Screens` class, one
constant per screen, written for you by 🗺 **Screens** and by the assistant. This guide says how a screen is told
apart, how a button with no picture of its own is pressed, and how the bot learns what a button's looks mean.

## 1. Tell each screen by its parts

A screen is told by **its parts that mark**: a picture, words or an app's element only it shows. In 🗺 Screens, pick
a screen and mark a part as a marker; a part can also be marked **absent**, one the screen never shows while a
look-alike does. A button can mark its screen too, and it still does while it shows another look (selected,
dimmed). Two screens may share a part: the whole set tells them apart.

Under **What the map cannot do**, the map says when two screens have the same set, or when one set sits inside
another, and names the part to add.

Bots made before November 2026 kept their markers in lists on the screen's setup. They move to parts the next time
the screen is saved, or all at once when the assistant runs `edit_map move_markers`.

## 2. Press what has no picture of its own

A slot whose content changes, such as an equipment slot showing whatever item is in it, has no fixed picture. Add it
as a **spot**: a place beside a stable picture (an anchor), measured in the anchor's width and height. It is
pressed only when the anchor is found, so the bot never clicks blind on another screen. The assistant does it with
`edit_map add_spot`, then tries the spot by its field name.

## 3. Let the bot learn what a look means

Games show a button's state by its look: dimmed while it cannot be used, brightened when it is selected, lit
while the pointer is over it. Do not cut each look as a picture of its own. The bot learns them as **shades**,
kept in `Sdk.shades()`:

- **What the game shows.** When two buttons show the same change from their cut pictures, `which_screen` proposes
  a shade. Keep it in 🗺 Screens' *Shades the game shows* (no screen picked) or with `edit_map learn_shade`, and
  pick what it means: *Disabled*, *Selected*, or a state of your bot's own (`States`), such as *Maxed*. A run never
  presses a button shown in a state that blocks it.
- **How buttons answer the bot.** In a screen's *How buttons answer the bot*, **Try on this screen** hovers,
  holds and Tabs two buttons, and proposes each change they show alike: keep it, and a run takes that look for the
  button as usual. The assistant does it with `edit_map learn_interactions`. A game that acts the moment a button
  is touched takes the hold as a press: the try stops there and keeps what it saw before.
