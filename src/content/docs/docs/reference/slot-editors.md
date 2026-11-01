---
title: Slot editors
description: The editors a plugin draws for one value, where Studio shows them, and the ValueContext they read and write through.
sidebar:
  order: 6
---

A slot editor is the control a person edits one value with: a colour swatch instead of `0xFF00AA`, a region picker
instead of `new Rect(12, 40, 300, 80)`. Studio shows it wherever that value is edited: in a block's slot on the
canvas, in a row of the Parameters window, and in your own windows.

Declared in `com.botmaker.plugin.api.slot`.

## Most editors belong to a type

Your own type declares its editor beside itself, in `PluginType.value(…).editor(…)`, so the type is named once
([Declare a plugin's values](/docs/how-to/declare-values/)). The `.editors(…)` step is for the rest: values the type
cannot tell apart, and types your plugin does not own.

```java
public final class ExampleEditors implements EditorHolder {

    /** Who {@code ExampleApi.greet} greets, the argument marked {@code @Greetee}. */
    public static final SlotEditor GREETEE = SlotEditor.onParameter(Greetee.class).draw(() -> GreetingEditor::who);

    /** Every editor this plugin offers, narrowest match first: the host tries them in this order. */
    @Override
    public List<SlotEditor> editors() {
        return List.of(GREETEE);
    }
}
```

The holder lists its editors **narrowest first**: Studio asks each in turn and the first that claims the value draws
it.

## Which values an editor claims

| First step | Claims | For |
|---|---|---|
| `SlotEditor.onParameter(Marker.class)` | every argument passed to a parameter carrying `@Marker` | a value its type cannot tell apart: an activity name, an outcome name and a label are all `String` |
| `SlotEditor.forType(Color.class)` | every value of that type | a type another plugin or the JDK owns |
| `SlotEditor.when(Owner::matches)` | every value the predicate accepts | anything else; the predicate takes a `ValueContext` |

`onParameter` compares the annotation by name, so it works across class loaders. It refuses at once an annotation
without `RUNTIME` retention or one that cannot sit on a parameter, since that editor would never appear. An editor
chosen by parameter never appears in the Parameters window: a row has no call behind it.

`when`'s predicate runs for every value a person opens, so keep it cheap. Do the work when drawing.

## Drawing

The next step is `.draw(() -> Owner::editor)`, or `.draw(() -> Owner::editor, () -> Owner::preview)`. Each method
takes a `ValueContext` and returns a JavaFX `Node`. The arrow before the method reference is required: building the
list of editors must not load JavaFX, because headless hosts such as `botmaker plugin validate` build it too.

A **preview** is a small picture of a value that nobody is editing, such as a thumbnail beside a declared choice in a
list. Its context is read-only: `set` does nothing and `slot()` is empty. Build a label, a swatch or an image, never
anything to click.

## The ValueContext

An editor reads the value and writes a new one. It never sees Java text:

```java
public static Node of(ValueContext ctx) {
    Greeting current = ctx.value(Greeting.class).orElseGet(() -> Greeting.to(""));
    return Fields.committing(current.who(), "Who to greet",
            who -> ctx.set(Greeting.to(who).times(current.times())));
}
```

| Member | What it gives |
|---|---|
| `value(T.class)` | The current value, built by the plugin that owns its type. **Empty is normal**: the Java is something Studio cannot read as a value, such as a variable, so show it read-only and leave it alone. |
| `set(value)` | Replaces the value. Studio writes the Java and its imports, touching nothing else in the file. Call it on the JavaFX thread, as often as a drag needs. |
| `write(value)` | `set`, answering why not when it could not write the value. |
| `member(set)`, `writeMember(set, member)` | Which constant of one of your open sets the value is written as, and writing it as one. |
| `type()` | The value's type, a `TypeRef`. It may be unresolved; treat that as "not mine". |
| `declared(T.class)` | The declaration of a type, for an editor that edits a value part by part. |
| `source()` | The expression's text, only to show it. Never parse it. |
| `services()` | `StudioServices`: the theme, dialogs, the project, your managed values ([Lifecycle and services](/docs/reference/plugin-services/)). |
| `slot()` | The call site, a `SlotContext`, when the value is a block's argument; empty in the Parameters window. |

An editor written against `ValueContext` works in both the canvas and the Parameters window. One that needs the call
site asks `slot()` and declines when it is empty. A `SlotContext` adds the enclosing call (`enclosingExecutable()`),
the argument's position (`argIndex()`), its `Parameter` with its annotations (`parameter()`), and the other
arguments read as values (`argumentValue(index, type)`).

Building an editor never writes and never throws. A value Studio cannot write is reported on the status line.
