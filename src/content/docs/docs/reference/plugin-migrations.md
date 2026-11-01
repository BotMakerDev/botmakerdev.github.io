---
title: Migration rules
description: How a plugin removes or reshapes a public element over two releases, and how to write the @Migrate rule that carries bots across.
sidebar:
  order: 11
---

A bot calls your plugin's public API as ordinary Java. When you rename, reshape or remove a public method,
constructor, field or class, every bot that uses it stops compiling. A `@Migrate` rule says what the old element
becomes, and Studio rewrites each use in the bot when its author upgrades your plugin.

## Two releases

1. **Release N** keeps the old element, marked `@Deprecated(forRemoval = true)`, and adds a `@Migrate` rule for it
   anywhere in your plugin. Your own build compiles the rule against the element that is still there.
2. **Release N+1** deletes the element and its rule together.

A plugin whose pom names `botmaker-plugin-parent` publishes a sources jar, and Studio reads your rules from it: the
annotation is kept only in sources. Studio reads the sources jar of the version the bot moves **from**, so an upgrade
from release N still finds the rule after N+1 dropped it. A bot that jumps from before N straight past it gets no
rule from your plugin, only Studio's default repair, and its author finishes by hand.

A rule the bot's author writes for the same element wins over yours. Two plugin rules for one element are both
refused.

## Writing a rule

A rule is a static method. **Its own signature names the old element**, so no member name is written as text. Its
body is what one use becomes, written against the API the bot moves to. Studio never runs it: at each use of the old
element, it substitutes the use's parts for the parameters.

```java
@Migrate(GameScreen.class)                                    // an instance method
static GameScreen marker(@Migrate.Self GameScreen self, ImageTemplate marker) {
    return self.markers(List.of(marker));
}

@Migrate(Run.class)                                           // a method gone, nothing in its place
static Run popups(@Migrate.Self Run self, Runnable popups) {
    return self;
}

@Migrate(ImageFinder.class)                                   // a static method, used as a statement
static void untilFind(ImageTemplate picture, Runnable step) {
    ImageFinder.repeatUntil(picture, step);
}

@Migrate(value = Rect.class, kind = Migrate.Kind.CONSTRUCTOR)
static Rect rect(int x, int y) {
    return new Rect(x, y, 0, 0);
}

@Migrate(value = State.class, kind = Migrate.Kind.FIELD)      // a constant
static State OFF() {
    return State.DISABLED;
}

@Migrate(name = "com.example.Area", kind = Migrate.Kind.TYPE) // a type that is gone
static Rect area(int x, int y, int width, int height) {
    return new Rect(x, y, width, height);
}
```

| `kind` | The old element is | The rule's |
|---|---|---|
| `METHOD` (the default) | a method of the owner | name is the old method's, and its parameter types pick the overload. A first parameter marked `@Migrate.Self` makes it an instance method. |
| `CONSTRUCTOR` | a constructor of the owner | parameter types pick the constructor. Its name is free. |
| `FIELD` | a field or constant of the owner | name is the old field's. It takes no parameter, or only its `@Migrate.Self` receiver for an instance field. |
| `TYPE` | the owner itself | parameters are an old value's parts in their declaration's order, and its return type is the new type. Every declaration naming the old type takes the new one. |

- **The owner** is `value = Owner.class`, or `name = "binary.Name"` when the type is gone and no class literal of it
  compiles. Give exactly one of the two.
- **The body** is one `return` of an expression, or one statement for a `void` rule.
- **An old parameter type that is gone** is written as the type its own `TYPE` rule returns.
- **A managed value** the rule changes is written beside the original as a copy marked `@Migrated`, and the original
  stays until its author switches the uses. Any other use is rewritten in place.

## Trying a rule

Build release N into your local Maven repository, and open a bot that uses the old element with **Dev mode** on
([Make and publish a plugin](/docs/how-to/make-a-plugin/#3-try-it-in-studio)). **Project ▸ Migrate…** lists each use
and the rule that rewrites it. [How upgrades repair a program](/docs/explanation/upgrades/) explains what Studio does
with the rest.
