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

| Step | The holder implements | What it contributes |
|---|---|---|
| `.types(…)` | `TypeHolder`: `types()`, and `components()` for parts | Value types a project's values may be (`value` package). |
| `.values(…)` | `ValueHolder`: `values()` | The plugin's managed values in the bot's Java (`source` package). |
| `.editors(…)` | `EditorHolder`: `editors()`, narrowest first | Editors for one value, shown where a block or a parameter needs one (`slot` package). |
| `.toolbar(…)` | `ToolbarHolder`: `toolbar()` | Buttons on Studio's toolbar, given as data (`toolbar` package). |
| `.runOverlay(…)` | `RunOverlayHolder`: `runOverlay()` | What is drawn over the game while the bot runs (`run` package). |
| `.overlay(…)` | `OverlayHolder`: `overlay()`, one holder | A panel in the overlay editor, beside the window the bot watches (`overlay` package). |
| `.assistant(…)` | `AssistantHolder`: `tools()` | Tools for the AI assistant that drives Studio (`assist` package); `.assistantGuide(…)` adds its guide. |
| `.trial(…)` | a method reference | The entry Studio calls to try one statement with **▶ Try**. |
| `.onProjectOpened(…)`, `.onProjectClosing(…)` | method references | What the plugin does when a project opens and closes (below). |

**Nothing is built before Studio asks.** A plugin is constructed while a project opens, and by tools that have
no JavaFX at all, such as `botmaker plugin validate` and the catalog's checks. A holder is a concrete class with a
constructor taking no arguments; Studio builds it the first time it needs that surface, so keep the values in
`static final` fields and the constructor empty. The toolkit's `PluginTests.assertDeclared(MyPlugin.class)` runs
the same check in your plugin's own `mvn verify`.

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

Removing or reshaping a public method, constructor, field or class takes two releases:

1. **Release N** keeps the old element, marked `@Deprecated(forRemoval = true)`, and adds a `@Migrate` rule for it
   anywhere in your plugin. The rule is written the way a bot's author writes one, naming its owner with `value =`.
   Your own build compiles it against the element that is still there.
2. **Release N+1** deletes the element and its rule together.

A plugin whose pom names `botmaker-plugin-parent` publishes a sources jar, and Studio reads your rules from it.
Studio offers to rewrite a bot's uses of the deprecated element, and the bot compiles against both releases.
A rule the bot's author writes for the same element wins over yours. A bot that jumps from before N straight past
it does not see your rule, and gets Studio's starting rules to finish by hand.

```java
@Migrate(GameScreen.class)
static GameScreen marker(@Migrate.Self GameScreen self, ImageTemplate marker) {
    return self.markers(List.of(marker));
}
```

## What Studio hands a plugin

When a project opens, Studio calls the method given to `.onProjectOpened(…)` with the project's `StudioServices`,
and the one given to `.onProjectClosing(…)` when it closes; a plugin that opened a port or a process releases it
there. One instance serves every project in turn, so keep the opening step cheap: a project's opening waits on it, and an exception in it is reported without
stopping the project from opening. `StudioServices` is what only Studio can answer:

| Service | What it gives |
|---|---|
| `projectDir()`, `resourcesDir()` | The project's folder and its resources folder. |
| `theme()`, `dialogs()` | The current look, and windows owned by Studio's. |
| `runs()` | The bot's runs: start, stop, pause and resume one, its run properties, and the trace lines it writes. |
| `pluginValues()` | Reading and changing the plugin's managed values in the bot's Java. |
| `history()` | Studio's undo history, so a plugin's change undoes like any other. |
| `status(…)` | A line in Studio's status bar. |
| `log()` | The plugin's log: `info`, `warn` and `error` lines Studio shows under the plugin in **Plugins & Libraries**. |

A plugin jar may also carry its changelog and icon: a plugin whose pom names `botmaker-plugin-parent` gets its
`CHANGELOG.md` and `icon.png` copied in by the build. Studio shows the changelog's new sections when a user
upgrades the plugin, and the icon beside its name.

## Compatibility

A plugin's compiled code cannot be rewritten by anyone, so the contract changes slowly: a new member arrives as a
`default` method, and a plugin built against an older release keeps loading. When Studio lacks a member a plugin
was built against, it says so at load instead of failing later; `botmaker plugin validate` runs the same check.
Plugins depend on each other as ordinary Maven dependencies.
