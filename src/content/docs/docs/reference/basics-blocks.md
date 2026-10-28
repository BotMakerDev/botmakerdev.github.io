---
title: What Basics adds
description: The value types and editors the Basics plugin brings to Studio.
sidebar:
  order: 2
---

[Basics](/plugins/BotMakerDev/botmaker-plugin-basics/) adds no blocks. It adds fourteen of Java's own value types, each with an
editor, so that wherever Studio asks for a value of one of them (a variable block, a block's value, a parameter in
**Project ▸ Parameters…**) you pick it instead of typing it. Nothing of Basics runs in your program: what it
writes is plain Java.

The [SDK](/plugins/BotMakerDev/botmaker-sdk/) brings Basics with it. Do not add Basics beside a plugin that already brings
it: the copy you add would win, and the plugin would run against a version it was not built for.

## The types

Types are listed in the order a type picker offers them. *Fresh* is the value a new one starts with.

| Type | Editor | Fresh | Written as |
|---|---|---|---|
| `String` | a text field that commits on Enter; **⤢** opens it as several lines | `""` | `"text"` |
| `boolean` | a switch saying **On** or **Off** | `false` | `true` |
| `int` | a number, stepped with ▲ and ▼ | `0` | `42` |
| `long` | the same | `0` | `42L` |
| `double` | a decimal number | `0.0` | `1.5` |
| `char` | one character; a character you cannot see is shown by name (`space`, `tab`), and **Special…** lists the hard-to-type ones | `'a'` | `'a'` |
| `java.awt.Color` | a colour swatch | white | `new java.awt.Color(255, 0, 0)` |
| `LocalDate` | a calendar | 1 January 2000 | `java.time.LocalDate.of(2026, 3, 1)` |
| `LocalTime` | a pill (`07:30`) that opens a 24-hour clock | midnight | `java.time.LocalTime.of(7, 30, 0)` |
| `OffsetTime` | the same clock, with an offset from UTC under it | midnight UTC | `java.time.OffsetTime.of(0, 0, 0, 0, java.time.ZoneOffset.UTC)` |
| `ZoneOffset` | a pill (`UTC+02:00`) that opens every offset clocks use | `UTC` | `java.time.ZoneOffset.ofHoursMinutes(2, 0)` |
| `Duration` | a pill (`1m30s`) that opens preset lengths, one spinner per unit, and the length in words | one second | `java.time.Duration.ofMillis(90000L)` |
| `DayOfWeek` | a row of seven days, Monday first | Monday | `java.time.DayOfWeek.MONDAY` |
| `Month` | a pill that opens the twelve months | January | `java.time.Month.MARCH` |

A field declared `Integer`, `Long` and so on gets the same editor as its primitive.

## What the editors keep

- **Seconds are always written** for a time, so `07:30:15` is never cut to the minute.
- **A duration is always milliseconds**, `Duration.ofMillis(n)`. A `Duration.ofSeconds(3)` you wrote yourself is
  shown as you wrote it, never rewritten.
- **A value out of range is shown as written**: `new Color(300, 0, 0)` or `LocalDate.of(2026, 13, 1)` is left
  alone rather than replaced.
- **Opening an editor and pressing OK without a change writes nothing.** A file you only opened comes back byte
  for byte.
- **The names are written in full** (`java.time.Duration`), so a value never depends on an import.

## Where another plugin offers more

In a project with the SDK, a `Color` is edited with the SDK's colour picker instead, which samples a frozen frame
of the game: Studio uses a plugin's own editor for a value before the editor that comes with its type.
