---
repo: BotMakerDev/botmaker-plugin-basics
name: BotMaker Basics
summary: Editors for everyday Java values. Durations, times, dates, colours, numbers and text.
headline: Pick a value
emphasis: instead of typing it.
---

Basics gives the JDK's own value types a proper editor in Studio. A parameter that is a `Duration` gets a
duration picker; a `LocalTime` gets a clock. What it writes is the plain Java you would have typed, such as
`Duration.ofMillis(2000)` or `LocalTime.of(7, 30, 0)`. Nothing of it runs in your program.

| Value | Its editor |
|---|---|
| text, a flag, a character, whole and decimal numbers | edited in place, numbers stepped with ▲ and ▼ |
| `Duration` | presets, spinners that carry over, the length in words |
| `LocalTime`, `OffsetTime` | a 24-hour clock |
| `LocalDate`, `Color`, `ZoneOffset` | one editor each |
| `DayOfWeek`, `Month` | their names |

The [SDK plugin](/plugins/BotMakerDev/botmaker-sdk/) brings Basics with it. For any other project, add it in
**Plugins & Libraries**.
