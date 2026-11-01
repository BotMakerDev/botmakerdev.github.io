---
title: Toolbar items
description: The buttons a plugin adds to Studio's toolbar and to the overlay editor, declared as data.
sidebar:
  order: 7
---

A toolbar item is a button that opens one of your plugin's windows or does one action. Studio gives each plugin a
tab of its own on the toolbar, and draws your buttons there: you describe a button as data, and Studio builds it,
orders it, packs it and themes it like every other.

Declared in `com.botmaker.plugin.api.toolbar`, listed by a `ToolbarHolder` and named in the plugin by
`.toolbar(MyToolbar.class)`.

## Declaring one

From the SDK:

```java
public final class SdkToolbarItems implements ToolbarHolder {

    public static final String GAME_ID = "game";

    public static final ToolbarItem GAME = ToolbarItem.id(GAME_ID).label(GameButton::label)
            .tooltip("Which game this bot plays on this computer — pick it from Steam, Heroic, Faugus, Lutris, "
                    + "Waydroid or the app menu, and start it without running the bot")
            .onBar(10)
            .enabledWhen(EnabledWhen.PROJECT_OPEN)
            .icon(GameButton::icon)
            .onPress(() -> GameDialog::open);

    @Override
    public List<ToolbarItem> toolbar() {
        return List.of(GAME);
    }
}
```

The steps, in order:

| Step | Says |
|---|---|
| `ToolbarItem.id(id)` | An id unique within your plugin. Keep it a constant: Studio remembers a button's state by it. |
| `.label("⚙ Bot Settings")` or `.label(Owner::label)` | The button's text. A supplier is read again whenever Studio refreshes the bar, so a button can say what the project holds now. |
| `.tooltip(sentence)` | What pressing it does. A button is a glyph and two words; the tooltip says the rest. |
| `.onBar(order)` or `.inOverlay(order)` | Where it goes: your tab on the main bar, or the overlay editor's Actions tab. Low order first, among your own items only. |
| `.enabledWhen(…)` | Optional: when it may be pressed. `ALWAYS` unless said. |
| `.icon(…)` | Optional: a resource in your jar or a URI, given as text or a supplier. |
| `.onPress(() -> Owner::open)` | What pressing it does: a method taking an `ActionContext`. |

A label or icon supplier runs on the JavaFX thread during layout. Read a field and format a string; anything that
touches a disk or the network belongs on a background thread whose result the supplier then reads.

The arrow in `.onPress(() -> …)` is required. It keeps the window's class from loading while the list is built,
which headless hosts do too.

## When it may be pressed

`EnabledWhen` is a closed set of the states Studio already tracks:

| Constant | Pressable |
|---|---|
| `ALWAYS` | always: the right answer for anything that opens a window |
| `PROJECT_OPEN` | only with a project open |
| `BOT_RUNNING` | only while a bot runs or is being debugged |
| `BOT_STOPPED` | only while no bot runs |

For a condition only your plugin understands, leave the button pressable and have the press say what is missing.

## What a press is given

`ActionContext` holds what only Studio knows:

| Member | What it gives |
|---|---|
| `services()` | The project's `StudioServices` ([Lifecycle and services](/docs/reference/plugin-services/)). |
| `overWindowTitle()` | The title of the window the overlay editor is drawn over. Empty on the main bar. |
| `overBounds()` | Where that window is now, asked at press time. Empty on the main bar. |

An item `inOverlay` acts on the window the overlay is drawn over, such as the SDK's **⌖ Point bot here**. A pane
rather than a button belongs in the overlay editor's tool tabs instead ([Overlays](/docs/reference/overlays/)).
