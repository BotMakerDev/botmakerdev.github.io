---
title: The plugin contract
description: The interfaces a plugin implements and the services Studio hands it.
sidebar:
  order: 4
---

`botmaker-studio-api` is the contract between Studio and a plugin: interfaces, records and annotations, with no
implementation and no Studio types in it. A plugin describes what it offers and hands values back as values;
**Studio writes every character of Java**. [Make and publish a plugin](/docs/how-to/make-a-plugin/) starts you
from a working one, and the contract's
[javadoc](https://jitpack.io/com/github/BotMakerDev/botmaker-studio-api/latest/javadoc/) describes every type.

```xml
<dependency>
    <groupId>com.github.BotMakerDev</groupId>
    <artifactId>botmaker-studio-api</artifactId>
    <version><!-- a release tag --></version>
    <scope>provided</scope>
</dependency>
```

It is `provided`: Studio has it already. Its one dependency is JavaFX, because a value editor is a JavaFX `Node`.
A plugin whose annotations end up in the bot's own code (a parameter, a managed value) depends on it at `compile`
instead.

## The plugin

A plugin is one jar with one class, a `public final` subclass of `DeclaredPlugin`, which takes the whole plugin as
one expression:

```java
public final class ExamplePlugin extends DeclaredPlugin {
    public ExamplePlugin() {
        super(StudioPlugin.declare()
                .types(ExampleTypes.class)
                .values(ExampleValues.class)
                .editors(ExampleEditors.class));
    }
}

public final class ExampleEditors implements EditorHolder {
    public static final SlotEditor GREETEE = SlotEditor.onParameter(Greetee.class).draw(() -> GreetingEditor::who);

    @Override
    public List<SlotEditor> editors() {
        return List.of(GREETEE);
    }
}
```

The jar's pom names that class, and Studio finds the plugin by nothing else:

```xml
<name>Greeter</name>
<properties>
    <botmaker.plugin>com.example.greetings.plugin.ExamplePlugin</botmaker.plugin>
</properties>
```

The pom's `groupId:artifactId` is the plugin's identity and its `<name>` the name a user reads. A jar whose poms
name two plugins, and a second jar with the same coordinate, are refused. If your build flattens the pom, keep
`properties` (`<pomElements><properties>keep</properties></pomElements>`), or the published jar no longer says it
is a plugin.

Every step is optional. Each surface is named by **holder classes**: the step's interface has one method saying what
the holder gives, so a holder handed to the wrong step does not compile.

| Step | The holder implements | What it contributes | Reference |
|---|---|---|---|
| `.types(…)` | `TypeHolder`: `types()`, and `components()` for parts | Value types a project's values may be (`value` package). | [Declare a plugin's values](/docs/how-to/declare-values/) |
| `.values(…)` | `ValueHolder`: `values()` | The plugin's managed values in the bot's Java (`source` package). | [Managed values](/docs/reference/managed-values/) |
| `.editors(…)` | `EditorHolder`: `editors()`, narrowest first | Editors for one value, shown where a block or a parameter needs one (`slot` package). | [Slot editors](/docs/reference/slot-editors/) |
| `.toolbar(…)` | `ToolbarHolder`: `toolbar()` | Buttons on the plugin's toolbar tab, given as data (`toolbar` package). | [Toolbar items](/docs/reference/toolbar-items/) |
| `.overlay(…)` | `OverlayHolder`: `overlay()`, one holder | A part of the overlay editor, beside the window the bot watches (`overlay` package). | [Overlays](/docs/reference/overlays/) |
| `.runOverlay(…)` | `RunOverlayHolder`: `runOverlay()` | What is shown over the game while the bot runs (`run` package). | [Overlays](/docs/reference/overlays/#the-run-overlay) |
| `.assistant(…)`, `.assistantGuide(…)` | `AssistantHolder`: `tools()` | Tools for the AI assistant that drives Studio, and how a bot built on the plugin is laid out (`assist` package). | [Assistant tools](/docs/reference/assistant-tools/) |
| `.trial(…)` | a method reference | The entry Studio calls to try one statement with **▶ Try**. | [Assistant tools](/docs/reference/assistant-tools/#-try-the-trial-entry) |
| `.readiness(…)` | a method reference | Whether the bot can start now, shown before a person presses Start. | [Lifecycle and services](/docs/reference/plugin-services/#saying-whether-a-bot-can-start) |
| `.onProjectOpened(…)`, `.onProjectClosing(…)` | method references | What the plugin does when a project opens and closes. | [Lifecycle and services](/docs/reference/plugin-services/) |
| `.catalog(…)` | `CatalogHolder`: `catalog()`, one holder | A palette built by hand instead of the one Studio finds; rarely wanted. | [The palette](#the-palette) |

**Nothing is built before Studio asks.** A plugin is constructed while a project opens, and by tools that have
no JavaFX at all, such as `botmaker plugin validate` and the catalog's checks. A holder is a concrete class with a
constructor taking no arguments; Studio builds it the first time it needs that surface, so keep the values in
`static final` fields and the constructor empty. The toolkit's `PluginTests.assertDeclared(MyPlugin.class)` runs
the same check in your plugin's own `mvn verify`.

A value type says what a new one is, how a person edits it, and which Java call it is written as:
`.writtenAs(Greeting::to)` reads the factory's parts by name, and chains each method marked `@Link`.
[Declare a plugin's values](/docs/how-to/declare-values/) covers every form, and
[Values are Java](/docs/explanation/values-are-java/) why Studio, not the plugin, writes the call.

## The palette

A plugin names none of its blocks. Studio finds the classes marked `@Palette` in its jar and offers every public
method of each as a block; the annotations in the `palette` package curate that:

```java
@Palette(category = "util", categoryLabel = "Greeter", icon = "👋")
public final class ExampleApi {
    public static String greet(String who) { return "Hello, " + who + "!"; }

    @Hidden
    public static String internalHelper(String who) { … }
}
```

| Annotation | Means |
|---|---|
| `@Palette` | The class is offered, in a category. |
| `@Hidden` | This member is not offered. |
| `@PaletteDefault` | The form a block is written with, when a method has several and their parameter count does not decide. |
| `@PaletteLabel` | A menu name other than the member's own. |

A palette that does not make sense is reported, never thrown: the menu misses an entry, and the project still
opens.

## What lives in the bot

Two annotations go on the bot's own code, which is why some plugins need the contract at `compile`:

- **`@Param`** (`params` package) on a static field makes it a parameter: whoever runs the bot may change it in
  the Runner window.
- **A plugin's managed values** are Java in the bot, marked with the plugin's own annotation, itself marked
  `@ManagedMarker` (`managed` and `source` packages). Each is a `public static` method or field Studio keeps up to
  date from the plugin's windows, rewriting only the value, never the code around it.

The `meta` package holds the marks Studio and the bot's author write as the bot moves between versions:
`@Refactor` and `@Migrate`. A plugin writes none of them into a bot. See
[How upgrades repair a program](/docs/explanation/upgrades/).

## Changing your API

Removing or reshaping a public method, constructor, field or class takes two releases: release N keeps the old
element `@Deprecated(forRemoval = true)` beside a `@Migrate` rule that rewrites a bot's uses, and release N+1 deletes
both. [Migration rules](/docs/reference/plugin-migrations/) shows how to write one.

## What Studio hands a plugin

When a project opens, Studio calls the method given to `.onProjectOpened(…)` with the project's `StudioServices`:
the project's folders, the theme, dialogs, the bot's runs, the plugin's managed values, the undo history, the status
line and the plugin's log. [Lifecycle and services](/docs/reference/plugin-services/) lists each.

A plugin jar may also carry its changelog and icon: a plugin whose pom names `botmaker-plugin-parent` gets its
`CHANGELOG.md` and `icon.png` copied in by the build. Studio shows the changelog's new sections when a user
upgrades the plugin, and the icon beside its name.

## Compatibility

A plugin's compiled code cannot be rewritten by anyone, so the contract changes slowly: a new member arrives as a
`default` method, and a plugin built against an older release keeps loading. When Studio lacks a member a plugin
was built against, it says so at load instead of failing later; `botmaker plugin validate` runs the same check.
Plugins depend on each other as ordinary Maven dependencies.
