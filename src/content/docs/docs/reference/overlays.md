---
title: Overlays
description: A plugin's part of the overlay editor (targets, watched screen, tools, probes) and what it draws over a running bot.
sidebar:
  order: 8
---

Studio has two overlays. The **overlay editor** is a panel docked beside the window a bot watches, where a person
builds the bot while looking at what it sees. The **run overlay** is what Studio shows while the bot runs: a small
run bar and a layer over the screen. A plugin adds to both, and Studio owns the panel, the script view, the caret
and every edit.

Every position on this page is in **the bot's pixels**, the space its clicks land in: the desktop's for a bot that
watches a window or a part of the desktop, and the private display's own for a bot that watches its private display.

## The overlay editor

Declared in `com.botmaker.plugin.api.overlay`, as one `OverlayPart` per plugin, given by an `OverlayHolder` and
named by `.overlay(MyOverlay.class)`. A second holder is refused. From the SDK:

```java
public final class SdkOverlay implements OverlayHolder {

    public static final OverlayPart PART = OverlayPart.of()
            .watched(SdkOverlay::watched)
            .changeWatched(() -> SourcePicker::choose)
            .frames(SdkOverlay::frames)
            .tool(SdkTools.PICTURE)
            .tool(SdkTools.POINT)
            .tool(SdkTools.SCREENS)
            .probe(ImageFinder::find, ImageTemplate.class, SdkProbes::find)
            .probe(ImageWaiter::waitFor, ImageTemplate.class, Duration.class, SdkProbes::find)
            .probe(ImageWaiter::waitUntilGone, ImageTemplate.class, Duration.class, SdkProbes::gone)
            .probe(ImageClicker::click, ImageTemplate.class, Probe.acting(SdkProbes::wouldClick))
            .probe(ImageWaiter::waitAndClick, ImageTemplate.class, Duration.class, Probe.acting(SdkProbes::wouldClick));

    @Override
    public OverlayPart overlay() {
        return PART;
    }
}
```

Every step is optional. A part that declares nothing is no part.

| Step | Answers |
|---|---|
| `.targets(Type.class, "Group")` | Where blocks go. `Type` is a functional interface of your plugin's. Studio offers every bot method passed by reference where a `Type` is expected, under the heading `Group`. |
| `.watched(Owner::watched)` | Which screen the bot looks at, so the panel opens over it without asking: a `Watched`. |
| `.changeWatched(() -> Owner::choose)` | Your own picker for that screen, opened by the panel's ⇄ Change. |
| `.frames(Owner::frames)` | What the bot sees, grabbed the way the bot grabs it. Without it, Studio grabs the watched screen itself. |
| `.tool(tool)` | A pane in the panel's tool tabs. |
| `.probe(Call::ref, Param.class…, Owner::probe)` | What a call would answer now, without running the bot. |

### Targets

Targets are found by type, never by name. `.targets(Chore.class, "Chores")` names a functional interface of the
plugin's; where the bot's Java passes a method reference as that type, `Farm.daily(Crops::water)`, Studio offers
`Crops.water()` as a chip labelled `Crops`. Studio reads that off the compiler's bindings: no method name crosses as
text. The SDK declares no targets.

### The watched screen and frames

`watched` and `frames` are method references taking an `OverlayContext`. Studio asks them again whenever the bot's
code changes, on the JavaFX thread, so they must be quick: read your own values, never the screen. A `Watched` is
one of three:

| Factory | The screen |
|---|---|
| `Watched.window(title)` | the window with that title |
| `Watched.region(area)` | a part of the desktop |
| `Watched.session()` | the project's private display |

`frames` answers a `FrameSource`, which Studio calls off the JavaFX thread, up to twice a second, to grab one frame.

### Tools

A tool is a pane that turns what is on screen into blocks:

```java
public static final OverlayTool PICTURE = OverlayTool.id("picture").named("Picture").pane(SdkTools::picture);
```

The pane method takes an `OverlayToolContext` and returns a `Node`. Studio builds it each time the panel opens. A
pane that throws loses only its own tab. The context gives:

| Member | What it does |
|---|---|
| `frame()`, `watchedArea()` | The watched screen now, and where it sits. |
| `pickRegion(prompt)`, `pickPoint(prompt)` | Let the person drag a box or click a point on the screen. |
| `marks()` | Boxes Studio draws over the screen for this tool. |
| `insert(Call::ref, arguments…)` | Inserts a call at the person's caret. Studio writes the Java; you hand values. |
| `insertVoid(Call::ref, argument)` | The same for a `void` method. |
| `onClosed(action)` | Runs once when the panel closes: close what the pane opened. |

An insert answers empty when it happened, otherwise the sentence saying why not: no caret, a value Studio cannot
write, or an edit that would not compile. It is one undo step, gated like the person's own edits:

```java
return context.insert(ImageClicker::click, new ImageTemplate(saved.path()))
        .map(refused -> said + " Not inserted: " + refused)
        .orElse(said + " Click inserted.");
```

### Probes

A probe says what a call would answer now, on the live frame: `ImageFinder.find(Pictures.ORE)` probed says whether
the ore is on screen and where. Studio shows it on the row the person is on, and draws its area as a box.

A probe is keyed by the call it probes: a method reference plus the class of each parameter (a receiver counts as
the first), because a bare reference cannot pick an overload. `probeMember(executable, probe)` takes a call a
reference cannot name. Declaring one call twice is refused.

```java
public static ProbeResult find(ProbeContext context) {
    return match(context).map(m -> m.found()
                    ? ProbeResult.found("found " + score(m.result) + " at " + at(m.result), area(m.result))
                    : ProbeResult.missing("not found — best " + score(m.result) + ", needs " + score(m.needs)))
            .orElseGet(() -> ProbeResult.unknown(why(context)));
}
```

The `ProbeContext` gives the frame, the probed call, and each of its arguments read as a value
(`argument(index, type)`, empty for something Studio cannot read). A probe runs off the JavaFX thread, up to a few
times a second. It only reads: it never clicks, types or writes. One that throws answers *unknown* with the
exception's message.

**Declaring a probe says the call only reads**, so ▶ Try may compute a value from it instead of running it. A call
that acts, such as a click, may still say what it *would* do: wrap its probe in `Probe.acting(…)`, and Try keeps
running the call.

## The run overlay

Declared in `com.botmaker.plugin.api.run`, as `RunOverlayPart`s given by a `RunOverlayHolder` and named by
`.runOverlay(MyRunOverlay.class)`:

```java
public static final RunOverlayPart PART = RunOverlayPart.id("sdk.run").bar(SdkRunOverlay::bar)
        .layer(SdkRunOverlay::layer);
```

Studio already shows what every run has: its controls and the last lines of its trace. A part adds what only your
plugin can say, in one place or both:

- **`bar`**: a node in the run bar, for a line of status such as what the bot is doing now.
- **`layer`**: a node over the whole desktop, in desktop pixels, that **takes no clicks**. Every click goes to the
  game beneath. A host that cannot make a window click-through shows no layer.

Each factory takes a `RunOverlayContext` and returns a `Node`. It runs on the JavaFX thread each time the overlay
opens. A factory that throws loses only its own part. The context gives `services()`, whose `runs()` is the run
shown, and `onClosed(action)`, where you close what you registered, such as a telemetry listener.

The layer also opens while the overlay editor is open. `mode()` says why it opened, `RUNNING` or `EDITING`, so one
layer serves both. The bar then sits in the editor panel's header.
