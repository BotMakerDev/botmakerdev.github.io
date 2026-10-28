---
title: Blocks of the SDK
description: Every block the SDK plugin adds, with the Java call it writes.
sidebar:
  order: 3
---

The [BotMaker SDK](/plugins/BotMakerDev/botmaker-sdk/) adds its blocks to the block menu under **FROM PLUGINS ▸
BotMaker SDK**, one submenu per class, each listing the class's methods. A block is one call: **Wait ▸ seconds**
writes `Wait.seconds(…)`. Typing in the menu's search box finds a block by name across every submenu. A method
with several forms is one block; Studio picks the form when it writes it, and you change its values on the block.

The classes are grouped below by what they are for. Every class is in `com.botmaker.sdk.api`, and Studio writes
the import.

## On the game's screens

These work with the bot's own map of the game, drawn in 🗺 **Screens**: a screen is a class, a button a field of
it (`Screens.HOME.collect`).

**Navigate**

| Block | What it does |
|---|---|
| `to` | Walks to a screen, by the ways the map knows. Answers whether it got there. |
| `press` | Presses a button or a hotkey of the map, walking to its screen first. Answers how it went: `.done()` |
| `type` | Types text into a text field of the map, in place of its text. |
| `state` | How a button looks now, such as greyed out; empty when it is not in view. |
| `isOn` | Whether the game shows a screen now. |
| `subject` | Which one a screen shows, read off it: the hero's name on a hero's page. |
| `next` | The screen that follows one on its own, such as a fight's Victory or Defeat. |
| `where` | The screen the game shows now; empty when it is none of the map's. |

## Pictures

A picture is a constant of the bot's `Pictures` class, cut with ✂ **Capture Templates**. A group is several
pictures, any of which may show. Each block looks on the bot's capture source unless it is given another.

**ImageFinder:** `find`, `findAny`, `findBest`, `findAll` answer whether a picture (or a group's) is on screen,
and how many. `findCompare`, `findAnyCompare` and `findAllCompare` take a second, "bad" group and count a match
only where it beats every bad picture there: a lit button against its greyed-out twin. Each holds its match for
the blocks after it.

| Block | What it does |
|---|---|
| `ifFind`, `ifFindAny`, `ifFindAll` | Run the blocks inside once, if the picture (any, all of the group) is on screen. |
| `whileFind`, `whileFindAny`, `whileFindAll`, `whileFindCompare` | Run them again and again while it stays on screen. |
| `untilFind`, `untilFindAny`, `untilFindAll` | Run them until it appears; after too many tries without it the bot counts as stuck. |

**ImageClicker:** `click` clicks a picture, answering whether it found it. `clickAll` clicks every copy of it,
`clickAny` the first of a group that shows, `clickBest` the best match of a group, and `clickCompare`,
`clickAnyCompare`, `clickAllCompare` click as the compare finds above. Inside a group block, `clickLast`,
`clickEachLast` and `clickAllLast` click what that block already saw, without looking again.

**ImageWaiter:** `waitFor` waits until a picture appears, `waitUntilGone` until it leaves, and `waitAndClick` until
it appears, then clicks it; each up to a time you give, answering whether it happened.

**ImageScroller:** `scrollAt` turns the wheel over a picture, positive up; `drag` drags a picture by a fraction of
the window, or onto another picture.

**ScreenWait:** `waitStable` waits until the screen stops changing, `waitChange` until it changes.

**Vision:** what the last picture block found, for the blocks after it: `lastMatch`, `lastMatchList`,
`lastMatches`, `lastMatchFound`, `ifLastMatch`, `clearLastMatch`, `inFrame`, and the same for colours
(`lastColorMatch`, `lastColorMatchList`, `lastColorMatchFound`, `ifLastColorMatch`, `clearLastColorMatch`).

## Colours and text

**Pixel**

| Block | What it does |
|---|---|
| `colorAt` | The colour at a point. |
| `matchesAt` | Whether the point's colour is close enough to a colour. |
| `find`, `findAll` | Finds a colour on screen; every patch of it, largest first. |
| `findInRange` | Finds a colour inside a band of red, green and blue values. |
| `coverage` | How much of the screen is that colour, from 0 to 1. |
| `waitFor`, `waitForGone` | Waits until the colour appears, or is gone. |
| `distance` | How far apart two colours look. |

**Text** reads the screen, or a part of it, with OCR.

| Block | What it does |
|---|---|
| `read`, `readAll` | All the text, as one string; every piece of it, with where it is. |
| `readDigits` | A number shown in a game font, read with pictures of its digits rather than OCR. |
| `find`, `findExact`, `findMatching`, `findFuzzy` | Whether a text appears: as part of a line, exactly, by a regular expression, or with a few letters wrong. |
| `findAll` | Every piece of text that contains it. |
| `waitFor`, `waitForGone` | Waits until a text appears, or is gone. |
| `lastMatch`, `lastMatchList`, `lastMatchFound`, `ifLastMatch`, `clearLastMatch` | What the last text block found. |

## Mouse, keyboard and waiting

**Mouse:** `click`, `doubleClick`, `rightClick`, `middleClick`, `move`, `down`, `up`, `hold` (a button held down for
a time), `drag`, `scrollUp`, `scrollDown`. A point is on the whole screen, or inside a capture source for the forms
that take one. To click something in the game, a picture block is nearly always better: it still works when the
window moves or changes size.

**Keyboard:** `tap` (press and release), `press`, `release`, `hold` (for a time), `combo` (a chord such as
Ctrl+S), `sequence` (several combos in turn), `type` (a string).

**Wait:** `seconds`, `milliseconds`, `minutes`, `time` (a `Duration`), and `between`, a random wait between two
lengths, new each time: the pause that looks human.

## The bot

**Bot:** `runFlow` runs the bot's flow, and is what its `main` calls; while `main` calls nothing, the block menu
offers it first as **▶ Run activity flow**. `stop` ends the bot from wherever it is, optionally saying what the
person running it should change.

**ActivitySwitch:** `active` answers whether an activity runs now; `enable` and `disable` switch one on or off for
the rest of the run (switched off, the flow takes its off-wire).

**Source:** `current` is the capture source the bot watches; `set` changes it until it is changed again.

## Asking and the rest

**Ask** asks whoever runs the bot and waits for the answer, in a dialog under Studio and on the console
elsewhere: `text`, `number`, `whole`, `yesNo`, `choice` (one of a
list).

**Time:** `now`, `today`, `currentTime`, `hour`, `minute`, `dayOfWeek`, `format` (with a pattern), and the tests
`isBetween` (two times of day), `isDay` (days of the week) and `isMonth`.

**Chance:** `between` (a whole number between two), `chance` (true with a probability), `pick` (one of several
texts), `duration` (a length between two).

**Sound:** `miaou` meows like the Scratch cat, and waits until it is done.

## What is not a block

Some of the SDK is written in Java only, because no block can pick its value yet. `Navigate.read` and
`Navigate.number`, which read a readout of the map (`Screens.HOME.gold`), are two of them: write them in the
bot's Java.

```java
OptionalLong gold = Navigate.number(Screens.HOME.gold);
if (gold.isPresent() && gold.getAsLong() > 100) {
    Navigate.press(Screens.SHOP.buy);
}
```
