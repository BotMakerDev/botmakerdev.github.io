---
title: Managed values
description: Values a plugin keeps in the bot's own Java, the three shapes they take, and how a plugin reads and changes them.
sidebar:
  order: 5
---

A managed value is a value your plugin keeps **in the bot's own Java**: a parameter, a flow, a set of pictures.
Studio writes it into a class of the bot's, finds it again by your plugin's mark, and lets nothing but your plugin
change it. There is no file of your own beside the bot: the value is Java, so a developer without BotMaker can read,
diff and refactor it, and the compiler checks every use of it.

Declared in `com.botmaker.plugin.api.source`, listed by a `ValueHolder` and named in the plugin by
`.values(MyValues.class)`.

## The mark

Every managed value is named by a constant of an enum nested in an annotation of your plugin's. That annotation is
meta-annotated `@ManagedMarker`, so the compiler checks every id. From the example plugin:

```java
@Documented
@ManagedMarker
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface GreetValue {

    Id value();

    /** Every value this plugin keeps in a bot. */
    enum Id implements ManagedId<Holder> {
        WELCOME
    }

    /** Every class of the bot's this plugin's values sit in. */
    enum Holder {
        GREETINGS
    }
}
```

`Id` names its `Holder` enum, so a value's `.in(…)` takes only one of these constants. A constant is UPPER_SNAKE and
names one class of the bot's, each `_` part capitalised: `GREETINGS` is `Greetings`, `FLOW_LAYOUT` is `FlowLayout`.
Another spelling, or two constants whose class names differ only by case, is refused when the plugin is declared.

The declaration refuses a mark without `RUNTIME` retention, one whose `@Target` leaves out where the value sits
(`METHOD` for a parameter or a method value, `TYPE` for an open set), and one whose `value()` is not that
enum. The bot's code carries the annotation, which is why a plugin with managed values puts the contract and its own
`api` package at `compile` scope.

## Three shapes

Pick the shape by who changes the value. Each entry point walks you through its own steps and answers its own type,
so the compiler offers only what that shape has.

| Who changes it | Declare with | You get | In the bot |
|---|---|---|---|
| the person running the bot, in the Runner or **Project ▸ Parameters** | `ManagedValue.param` | `ManagedParam<T>` | a method of a `@Param` group, its body the value |
| a window of your plugin, one value | `ManagedValue.method` | `ManagedMethod<T>` | `public static T id() { return …; }` |
| a window of your plugin, a set the user grows | `ManagedValue.openSet` | a `ManagedOpenSet<T>` | a class of constants, an enum, a class of enums, or a class of classes |

Declare each one once, as a `public static final` field, and use that field everywhere: the holder lists it, the
runtime claims it, and your windows open it.

### A parameter

```java
public static final ManagedParam<Greeting> WELCOME = ManagedValue.param(GreetValue.Id.WELCOME)
        .in(GreetValue.Holder.GREETINGS)
        .startsAs(ExampleValues::welcome)
        .shown("Greetings", "Who the bot greets first", Param.Visibility.PUBLIC)
        .because("This plugin reads this parameter. Change its value in the Runner or Project ▸ Parameters.");
```

1. `param(id)`: the mark's constant.
2. `.in(GreetValue.Holder.GREETINGS)`: the bot's class that holds it, as a constant of your `Holder`. It is the
   bot's class, so your plugin never compiles against it.
3. `.startsAs(Owner::method)`: its first value, as a method reference, which also gives its full type.
4. `.shown(category, description, visibility)`: where the Parameters window lists it.
5. Optionally `.when(scope -> …)`: a parameter that applies only to some projects. Studio writes it only while the
   condition holds.
6. `.because(reason)`: the sentence a user reads when Studio stops them renaming or deleting the method.

The method is named after the id in camel case (`WELCOME` is `welcome`) and sits in the group `Greetings`, in the bot's
package `params.<groupId>.<artifactId>`. Studio appends it whenever the group has no method with that mark. The
Parameters window never renames, retypes or removes it, because the bot's own code names it.

`params/` is private to each computer and never committed, published or put in a `.bmk`. The committed
`starting-params/` mirrors it with the author's starting values and fills what `params/` lacks; a new parameter's
starting copy holds its type's blank value, not the value on the author's computer.

### A method value

```java
public static final ManagedMethod<FlowLayout> FLOW_LAYOUT = ManagedValue.method(SdkValue.Id.FLOW_LAYOUT)
        .in(SdkValue.Holder.SDK)
        .holds(FlowLayout.class, FlowLayout.NONE)
        .because("These are where the Activity Flow's cards sit. Drag them in 🔀 Activity Flow, which keeps"
                + " them in step with the activities' names.");
```

`SdkValue.Holder.SDK` is the class `Sdk`. In the bot it is a method marked with the id, whose one `return` Studio rewrites:

```java
@SdkValue(SdkValue.Id.FLOW_LAYOUT)
public static FlowLayout flowLayout() {
    return FlowLayout.of(Map.ofEntries(…));
}
```

`.holds(type, initial)` says what it returns and what a created one starts as. `.openedOnly().holds(type)`, in place
of `.in(…)`, declares a value Studio opens when the bot has it and never creates.

### An open set

A class of the bot's marked with the id, whose members the rest of the bot names. Studio creates it empty. The step
after `openSet(id)` picks what a member is:

| Step | A member is | Example in the bot |
|---|---|---|
| `.of(E.class)` | a constant of class `E` | `Pictures.ORE` |
| `.ofEnum(E.class, Owner::byName)` | a constant of the holder, itself an enum implementing `E` | `Modes.FAST` |
| `.ofEnumGroups(E.class, Owner::byName).groupedAs(G.class, Owner::byGroup)` | a constant of an enum nested in the class | `Activities.Collect.WON` |
| `.ofClasses(E.class).fields(…).setup(…)` | a class nested in the class | `Screens.Market` |

```java
public static final ManagedOpenSet.OfConstants<ImageTemplate> PICTURES = ManagedValue.openSet(SdkValue.Id.PICTURES)
        .of(ImageTemplate.class)
        .in(SdkValue.Holder.PICTURES)
        .because("Picture constants are managed in 🖼 Manage Pictures.");
```

For a set whose members are told apart by name rather than by value, such as two flows that both start empty,
`.referredToAs(Owner::byName)` before `.in(…)` makes a use of a constant read as that constant, and Studio writes
it back as the constant. An open set is a holder of its own: give it a `Holder` constant no other value uses.

Open sets change **by binding, never by spelling**: a rename changes the declaration and every use the compiler
resolves to it, qualified uses and static imports included, and a change that would stop the bot compiling is
refused.

## At run time

The bot reads a parameter as a plain method (`new Greetings().welcome()`) and a member as a constant (`Pictures.ORE`). A
method value reaches your runtime through `ManagedValues`:

```java
// the plugin's runtime half, once
ManagedValues.claim(MyValues.GREETING, Greeter::use);

// the bot's main, through whatever entry point the plugin offers
ManagedValues.install(Values.class);
```

## Changing values from a window

A window reads and writes values through `services.pluginValues()`, a `PluginValues`. Every operation takes your
`ManagedValue` constant, and a member of a set is a `PluginValues.Member` (`Member.of("ORE")`), so a plugin never
spells an id.

| Operation | What it does |
|---|---|
| `open(value)` | A `ValueContext` over the value's expression: the same interface a slot editor gets. Empty when the method's body is not one `return`. |
| `create(value)` | Writes the class that holds `value`, with each of your method values in it, when the project has none. Never overwrites a file. |
| `members(set)`, `open(set, member)` | The set's members, and one member's value. |
| `add`, `rename`, `repoint`, `remove`, `moveBefore` | Change the set; `uses(set, member)` lists what names a member. |
| `groups`, `addGroup`, `renameGroup`, `removeGroup` | The nested enums of a grouped set. |
| `addClass` | A nested class of a set of classes. |
| `methods`, `createMethod` | The bot's methods of a shape (such as `void` ones), and a new one. |
| `appendCall(method, call, arguments…)` | Appends one call of your own to a bot method, for a plugin that records what the author did. |

Each change but `createMethod` answers `Optional<String>`: empty when it happened, otherwise the sentence saying why
not. Wrap several
writes in `services.history().batch("Move 3 cards", () -> …)` to undo them as one step.

The toolkit's `ManagedHandle` and `ManagedSet` wrap these calls for a window.

## When your plugin changes a value's shape

Nothing converts a managed value. A value that no longer compiles after an upgrade is repaired like the rest of the
bot's code: reset to its first value and marked `@Refactor`, or carried over by a rule you ship
([Migration rules](/docs/reference/plugin-migrations/)). See
[How upgrades repair a program](/docs/explanation/upgrades/).
