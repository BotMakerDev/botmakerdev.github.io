---
title: Declare a plugin's values
description: Tell Studio what a new value is, how a person edits it, and which Java call it is written as.
sidebar:
  order: 6
---

A bot holds your plugin's values as ordinary Java: `Greeting.to("world").times(3)`. Studio reads that call back into
a value, hands the value to your editor, and writes the edited one back as Java. To do that it needs three things
from you, for each type: what a new one is, how a person edits it, and which call it is written as. This guide
declares them. [Values are Java](/docs/explanation/values-are-java/) explains why it works this way.

Start from the project `botmaker plugin new` makes ([Make and publish a plugin](/docs/how-to/make-a-plugin/)); its
`DECLARE.md` walks through the same example.

## 1. A type: fresh, editor, Java

A type a bot can hold and Studio can edit is a `PluginType`, kept in a `static final` field of a class that
implements `TypeHolder`:

```java
public final class ExampleTypes implements TypeHolder {

    public static final DeclaredCallType<Greeting> GREETING = PluginType.value(Greeting.class)
            .fresh(() -> Greeting.to("world"))
            .editor(() -> GreetingEditor::of)
            .writtenAs(Greeting::to);

    @Override
    public List<PluginType<?>> types() {
        return List.of(GREETING);
    }
}
```

The steps come in a fixed order, and each offers only what may come next, so the compiler walks you through it:

1. **`fresh(…)`**: what a new one starts as, when a person adds one. An enum may use `firstConstant()`.
2. **`editor(…)`**: how a person edits one. The arrow before the method reference is required: it keeps JavaFX
   from loading in a host that never draws, such as `botmaker plugin validate`. `preview(…)` may follow, for how
   a value looks before it is clicked.
3. **`writtenAs…`**: which Java the value is written as. The rest of this guide is about this step.

The plugin class names the holder: `StudioPlugin.declare().types(ExampleTypes.class)`.

## 2. The short form: a factory and its links

Your own type needs only its factory:

```java
public record Greeting(String who, int times) {

    public static Greeting to(String who) {
        return new Greeting(who, 1);
    }

    @Link
    public Greeting times(int times) {
        return new Greeting(who, times);
    }
}
```

```java
.writtenAs(Greeting::to)
```

Studio finds every part of the call by name and type:

- **Each factory parameter is read by the accessor of the same name.** `to(String who)` is read by `who()`. A
  `boolean` parameter may also be read by `isX()`. The accessor's type must fit the parameter.
- **Each method marked `@Link` is chained after the factory.** `times(int)` pairs with `times()`. A `@Link` that
  takes nothing is a flag, `dragged()`, read by `boolean isDragged()`. `@Link` is
  `com.botmaker.plugin.api.value.Link`, from the contract. A link inherited from an interface counts.
- **Links are written in a fixed order:** a record's in the order of its components, any other type's by name. A
  `@Link` whose reader a factory parameter already reads is skipped, since the factory writes that part.
- **A link is written only when it changes the value.** `Greeting.to("world")` already has `times` 1, so Studio
  writes no `.times(1)`.

A parameter name is only kept when the class is compiled with `-parameters`. `botmaker-plugin-parent` does that for
you; in a build of your own, add it to `maven-compiler-plugin`.

Names are checked when the declaration is first built, which happens in your own `mvn verify`
(`PluginTests.assertDeclared`) and in `botmaker plugin validate`: never in a bot. A parameter or a `@Link` with no
reader of its name and type is refused with a message naming it:

```text
com.example.greetings.api.Greeting.to's part who has no reader: com.example.greetings.api.Greeting needs a public who() answering a java.lang.String, or give an accessor per part

com.example.greetings.api.Greeting.times is marked @Link but com.example.greetings.api.Greeting has no public times() answering a int to read its part by: rename the reader, or declare the link with .with/.flag
```

Rename one side, or name the reader yourself (section 4).

A larger example from the SDK: a tree of buttons, `Tree.of(nodes)` followed by any of `.dragged()`, `.wheel(3)` and
the traits every input has, is declared as

```java
public static final DeclaredCall<Tree> TREE_SHAPE = ComponentType.part(Tree.class)
        .writtenAs(Tree::of)
        .<BooleanSupplier>with(Tree::when, Parts.INPUT_WHEN.part(ScreenTypes::condition));
```

Only `when` is spelled out, because its value is a method reference (section 5).

## 3. Parts: calls that are not types of their own

A value often holds other calls: a `Tree` holds `Node`s, each `Node.of(picture)`. A call nobody edits on its own is a
**part**, declared with `ComponentType.part` instead of `PluginType.value`. It has no fresh value and no editor,
only its Java:

```java
public static final DeclaredCall<Node> NODE_SHAPE = ComponentType.part(Node.class).writtenAs(Node::of);
```

The holder lists its parts in `components()`, beside `types()`. Studio reads and writes a part inside the value
that holds it.

## 4. When names do not pair: the explicit form

Some types have no `@Link`s and no parameter names to read: JDK classes, or a library's. Some pairs have
different names on each side. Name the readers yourself, one per factory parameter, in order:

```java
public static final PluginType<LocalDate> DATE = PluginType.value(LocalDate.class)
        .fresh(() -> LocalDate.of(2000, 1, 1))
        .editor(() -> BasicsEditors::date)
        .writtenAs(LocalDate::of, LocalDate::getYear, LocalDate::getMonthValue, LocalDate::getDayOfMonth);
```

A link is named the same way, after the factory:

| Step | Writes | Example |
|---|---|---|
| `.with(wither, reader)` | `.wither(part)` wherever the part differs from what the factory makes | `.with(BotSettings::displayBackend, settings -> settings.runIn().displayBackend())` |
| `.flag(wither, isOn)` | `.wither()` wherever the value has it on and the factory's value has not | `.flag(Combo::repeating, Combo::repeats)` |

A `.with` or `.flag` on a method that is also marked `@Link` replaces the inferred link in its place, so the two
forms mix. A flag only turns something on; a setting that is on by default is declared by its negative (`.off()`).

When javac cannot tell the factory's overloads apart, give the type arguments:
`.<Key, Hotkey>writtenAs(Hotkey::of)`.

## 5. Parts Studio holds as something else: `Held`

Some parts are not values Studio can write as they are. A `BooleanSupplier` is written as a method reference,
`.when(Bot::inBattle)`, so Studio holds it as the text it reads. Declare such a part once, as a `Held` constant, and
say how the text turns back into the part:

```java
static final Held<Input, String> INPUT_WHEN = Held.as(String.class, input -> sourceOf(input.when()));
```

```java
.<BooleanSupplier>with(Strip::when, Parts.INPUT_WHEN.part(ScreenTypes::condition))
```

`Held.as(kind, take)` reads the part off a value; `.part(give)` turns what Studio holds back into what the wither
takes. A factory that takes nothing Studio can hold, such as a class literal, uses `Held` parts in every place and
`.builtFrom(parts -> …)` to build the value from them.

## 6. Several factories for one class

A class built in several ways is declared once per factory. Studio reads a call of any of them. It writes a value
with the first declaration that builds it back equal (`ComponentType.writer`). When none does, it uses the first
declaration that writes it.

```java
public static final DeclaredCall<Hotkey> HOTKEY_KEY_SHAPE = ComponentType.part(Hotkey.class)
        .<Key, Hotkey>writtenAs(Hotkey::of)
        .<BooleanSupplier>with(Hotkey::when, Parts.INPUT_WHEN.part(ScreenTypes::condition));

public static final DeclaredCall<Hotkey> HOTKEY_COMBO_SHAPE = ComponentType.part(Hotkey.class)
        .<Combo, Hotkey>writtenAs(Hotkey::of)
        .<BooleanSupplier>with(Hotkey::when, Parts.INPUT_WHEN.part(ScreenTypes::condition));
```

This needs your type's `equals` (a record has one): without it no value builds back equal, so the first
declaration writes them all. Add `.when(predicate)` only for a choice equality cannot make:
a value written as a constant when one holds it, or a value holding a lambda, which nothing builds back equal.

```java
public static final DeclaredCall<PictureTag> PICTURE_TAG = ComponentType.part(PictureTag.class)
        .<String, PictureTag>writtenAs(PictureTag::named, PictureTag::name)
        .when(tag -> BotConstants.tagName(tag) == null);
```

## 7. Other shapes

A call, on `PluginType.value(…)` after `editor` or on `ComponentType.part(…)`:

| Step | Writes | For |
|---|---|---|
| `writtenAsRecord()` | `new Point(3, 4)`, the canonical constructor, each part by its accessor | a public record with no factory |
| `writtenAsEach(Combo::of, Combo::keys)` | `Combo.of(a, b, c)` | a varargs factory |
| `.constants(Plan.NONE)` | the constant, for a value equal to it | after any of the call steps above |

A type that is no call, on `PluginType.value(…)` only:

| Step | Writes | For |
|---|---|---|
| `writtenAsConstant()` | `Mode.FAST` | an enum |
| `writtenAsLiteral()` | `"text"`, `42`, `true` | `String`, `Character`, `Boolean`, a JDK number, or a primitive |
| `writtenAsParts()` | whichever part's call built it | an interface or abstract class, each implementation declared as a part |

## 8. Check it

```bash
mvn verify                  # PluginTests.assertDeclared builds every declaration
botmaker plugin validate    # what Studio and the catalog check, headless
```

`plugin validate` also takes each type's fresh value apart, builds it back, and takes it apart again. It refuses a
declaration whose parts change on the way. It compares parts, not values, so a type needs no `equals` for this:

```text
<plugin>: <type> does not survive build(components(…)): <parts> came back as <other parts>. The host writes the parts and reads them back through build(), so a value that changes on the way is rewritten on every save
```

It refuses, too, a fresh value no declaration writes, and a part of a type no declaration writes.

Then try it in Studio with **Dev mode** on ([Make and publish a plugin](/docs/how-to/make-a-plugin/#3-try-it-in-studio)):
edit a value and read the Java Studio wrote back.
