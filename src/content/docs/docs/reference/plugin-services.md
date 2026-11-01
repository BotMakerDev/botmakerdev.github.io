---
title: Lifecycle and services
description: What a plugin does when a project opens and closes, how it says whether a bot can start, and the StudioServices Studio hands it.
sidebar:
  order: 10
---

A plugin is constructed once and serves every project in turn. Studio tells it when a project opens and closes, and
hands it `StudioServices`: what only Studio can answer, such as which project is open or how to undo a change.

## Opening and closing a project

```java
super(StudioPlugin.declare()
        .types(MyTypes.class)
        .onProjectOpened(MySession::open)
        .onProjectClosing(MySession::close));
```

- **`.onProjectOpened(Owner::open)`** names a `static void open(StudioServices services)`. Keep the services there
  if you need them later, such as `services.log()` or `services.runs()`. The project's opening waits on this method,
  so keep it cheap. An exception in it is reported, and the project still opens.
- **`.onProjectClosing(Owner::close)`** names a `static void close()`, for a resource the operating system counts:
  a port, a display, a process. The same instance serves the next project, so closing means *this project is over*,
  never *you are being discarded*.

## Saying whether a bot can start

```java
StudioPlugin.declare().readiness(MyReadiness::now)

static Readiness now() {
    return windowOpen() ? Readiness.ready("game window found")
            : Readiness.blocked("the game is not running: start it first");
}
```

The run window shows one line before a person presses Start, such as *● Ready — game window found*. Studio asks
every plugin, shows the least ready answer, and asks again every few seconds while the run window is open. Answer
with `Readiness.ready`, `waiting` or `blocked` and a reason, or `null` for nothing to say.

The check runs off the JavaFX thread. It may read files or list windows, but must return within a second. A check
that throws loses only its own answer.

## StudioServices

The same object reaches the opening step, a slot editor (`ctx.services()`), a toolbar press, an overlay and an
assistant tool. It grows a member only when Studio is the **only** possible source of it. Everything a plugin can
do for itself, such as listing windows or grabbing pixels, it does through `botmaker-shared`, which any plugin may
depend on.

| Member | What it gives |
|---|---|
| `projectDir()` | The open project's folder. |
| `resourcesDir()` | **Your plugin's own** resources folder, `src/main/resources/plugins/<group>/<artifact>/`, so two plugins never write the same file. A path you put in a value is relative to it, `images/ore.png`, and the bot finds it on its classpath. |
| `theme()` | Studio's look: `apply(scene)`, `scene(root)`, `alert(type, message)`, so your windows match. |
| `dialogs()` | File, folder and program choosers, and a save dialog, owned by Studio's window. |
| `runs()` | The bot as a process (below). |
| `pluginValues()` | Your managed values in the bot's Java ([Managed values](/docs/reference/managed-values/)). |
| `history()` | Studio's undo history (below). |
| `status(line)` | One line in Studio's status bar, for what a long action is doing. Not for errors: something a person must act on is a dialog. |
| `log()` | Your plugin's log (below). |

Members after `dialogs()` have defaults, so a host that cannot answer one, such as `botmaker plugin validate`, still
answers honestly: `runs()` does nothing, `history()` just runs your writes.

### Runs

`runs()` is the open project's bot as a process: Studio compiled it and owns it.

| Member | What it does |
|---|---|
| `start()`, `stop()`, `isRunning()`, `pid()` | Start and stop the bot, and ask about it. |
| `pause()`, `resume()`, `isPaused()`, `canPause()` | Pause it, where the host can. |
| `onStateChanged(listener)` | Hear it start and stop. |
| `onTrace(listener)` | Each trace line the run writes, a `TraceLine`. |
| `onTelemetry(listener)` | Each telemetry frame, as the bytes your runtime sent. Studio does not read them; your plugin decodes its own. |
| `get(property)`, `set(property, value)` | Run properties: values kept on this computer and passed to every run as `-D<name>=<text>`. |

Each `on…` answers an `AutoCloseable`. Close it when your window closes, or a listener keeps feeding a window nobody
sees.

A run property is declared once with how its text is read and written, so you never parse it by hand twice:

```java
static final RunProperty<String> MODE = RunProperty.text("com.example.mode");
```

`RunProperty.of(name, parse, format)` declares one of any type. Name only your own properties. A bot's facts belong in
its Java, and a choice the person running the bot makes is a [`@Param`](/docs/reference/managed-values/), so a run
property is for what differs between computers.

### History

Each write through `pluginValues()` is a step in Studio's undo history. `history().batch("Move 3 cards", () -> …)`
records every write inside it as one step. `canUndo()`, `undo()`, `undoLabel()` and the redo ones let your window
show its own ↶ and ↷, and `onChanged(listener)` tells it when to re-read them.

### The log

`log().info(…)`, `warn(…)` and `error(message, cause)` write lines Studio shows under your plugin in
**Plugins & Libraries ▸ Installed ▸ Log**, and in Studio's own log. Studio also logs there what your steps throw. It is
not a channel to the person: use a dialog or `status` for that.
