---
title: Assistant tools
description: Tools a plugin offers the AI assistant that drives Studio, their parameter records, and the ▶ Try entry.
sidebar:
  order: 9
---

Studio serves its own tools to an AI assistant over MCP: read the blocks, insert one, run the bot. What only your
plugin can do, such as taking a screenshot of what the bot watches or cutting a picture, it offers as an
`AssistantTool`.

Declared in `com.botmaker.plugin.api.assist`, listed by an `AssistantHolder` and named in the plugin by
`.assistant(MyTools.class)`. `.assistantGuide(GUIDE)` adds plain sentences on how a bot built on your plugin is laid
out: where each kind of work goes, and what to name.

## Declaring one

```java
record Crop(@Describe("the picture's name") String name, int x, int y, int width, int height) {}

static final AssistantTool<Crop> CROP = AssistantTool.named("cut_picture")
        .describedAs("Cuts a picture out of the watched screen and adds it to Pictures")
        .takes(Crop.class)
        .handledBy(SdkAssist::crop);
```

| Step | Says |
|---|---|
| `AssistantTool.named("cut_picture")` | The name, `snake_case`, unique within your plugin. Studio serves it prefixed with your plugin's, so two plugins' tools never collide. |
| `.describedAs(sentence)` | What it does, as the assistant reads it. |
| `.takes(Params.class)`, `.takesOneOf(Actions.class)` or `.takesNothing()` | Its parameters. |
| `.handledBy(Owner::handle)` | A method taking the parameters and an `AgentContext`, returning an `AgentReply`. |

## Parameters are a record

The record's components are the tool's input schema: the assistant sees their names, types and `@Describe`
sentences, and your handler gets a record built from what it sent. A component may be:

- `String`, `boolean`, `int`, `long`, `double`, or their boxes;
- an enum;
- a nested record;
- a `List` of `String`, of an enum, of a record, or of a sealed interface of records;
- a `Map<String, String>`.

A component of any other type is refused when the tool is declared, naming the record and the component, so a bad
tool fails your plugin's own tests, not an assistant's call. A record may not hold itself.

`@Describe(value = "…", optional = true)` lets the assistant leave a component out. The handler then sees `null`, so
an optional component must be a reference type: `Integer`, not `int`. A component whose wire name cannot be its Java
name takes `@Key`: `@Key("wait") Integer seconds`.

## One tool for a family of actions

Rather than a tool per verb, `takesOneOf` a sealed interface whose records are the actions, and `switch` over them:

```java
sealed interface Edit {
    @Describe("Renames a screen") record Rename(String screen, String to) implements Edit {}
    record SetStart(String screen) implements Edit {}
}
static final AssistantTool<AssistantTool.OneOf<Edit>> EDIT_MAP = AssistantTool.named("edit_map")
        .describedAs("Edits the screen map").takesOneOf(Edit.class).handledBy(MapTools::edit);
```

The assistant sends `action` (`"rename"`, `"set_start"`: the record's name in `snake_case`) and that action's fields
beside it. A field the action does not take, and a missing one it needs, are refused in a sentence. A component of
the same name in two actions must hold the same type. The actions are one level deep: flatten a nested sealed
interface into records.

## Handling a call

The handler runs **off the JavaFX thread**. Its `AgentContext` gives `services()`, the watched screen
(`frame()`, `watchedArea()`) and `marks()`, the boxes Studio draws over the screen to show the person what the
assistant means.

It answers an `AgentReply`:

| Factory | The assistant gets |
|---|---|
| `AgentReply.text(line)` | a line to read |
| `AgentReply.image(png)` or `AgentReply.image(bufferedImage)` | a picture to look at |
| `AgentReply.refused(why)` | a refusal that says what to do instead |
| `reply.and(more)` | both, in order |

A refusal is an answer, not an error: the assistant reads the sentence and tries something else. A handler that
throws is reported the same way, with the exception's message.

**A tool may change only what your plugin already may.** It writes your managed values through
`services().pluginValues()`, gated as your own windows are. It cannot write Java, click or type: the assistant acts
on the game only by running the bot.

## ▶ Try: the trial entry

`.trial(Bot::trial)` names the static method Studio calls to try one statement, from the **▶ Try** button or the
assistant. It must be `public static` and take `(Runnable, Class<?>...)`: a body, and the classes whose managed
values the run installs. It does the setup a run does (capture source, settings, input), then runs only the body.

The declaration step checks the method, so a lambda or a method of the wrong shape fails your plugin's own
construction, never a person's ▶ Try. Studio writes the throwaway caller itself, never into the project's sources.

When the body is one of the bot's methods run whole, Studio sets the system property `TrialEntry.TARGET`
(`botmaker.trial.target`) to that method (`com.bot.Collect#body`) first, so your entry can do what a run does before it.
