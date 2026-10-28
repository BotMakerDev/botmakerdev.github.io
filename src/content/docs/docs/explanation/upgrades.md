---
title: How upgrades repair a program
description: What happens to your program when a plugin it uses changes.
sidebar:
  order: 3
---

A plugin is free to change between releases. It may rename a method, reshape a value, or delete a whole class.
It usually keeps the old element deprecated for one release, with a `@Migrate` rule of its own that Studio
applies for you, but it does not have to. That freedom is what keeps plugins simple, but it means a newer release can break a
program written against an older one. This page explains how Studio carries your program across, and why it works
the way it does.

## Two kinds of thing break

Your program uses a plugin in two ways:

- **It calls the plugin's code.** `ImageClicker.click(Pictures.COLLECT)` is a call. If the new release renames or
  reshapes `click`, the line no longer compiles.
- **It holds the plugin's values.** The SDK keeps your pictures, screens and flows as Java in your program, marked
  with the plugin's annotation (`@SdkValue`). If the new release declares those values another way, the old ones no
  longer read.

Both are plain Java in your project. So Studio repairs both the way it repairs any code, and it starts by keeping
a copy.

## What an upgrade does

When you upgrade a plugin in **Project ▸ Plugins & Libraries…**:

1. **Studio saves a version first.** Whatever happens next, the program as it was is one restore away in
   **Project ▸ Versions**.
2. **It repairs the values.** It reads your program against the release you are moving to:
   - a value whose kind is gone, or that is declared another way now, is removed. If your own code still names it,
     it is kept instead, as ordinary code that is yours from then on;
   - a value that no longer compiles is reset to its declaration's first value, and marked `@Refactor`;
   - everything else is left exactly as written.
3. **It repairs the calls** with the rules you wrote, described below.

Nothing refuses the upgrade: what Studio could not check, it says.

## Why a guess is marked, never hidden

A reset value compiles, but it is a value you never chose. Studio cannot know what you meant, so it does not
pretend to: it writes the guess and marks the function it happened in.

```java
@Refactor("the call to Mouse.click(x, y) was removed by the SDK's new release, and the value it produced is now false")
public static Activities.Collect body() { … }
```

The **Review** tab lists every mark still to look at. Marking one reviewed sets `done = true` rather than deleting
it, so the record stays with the code until you remove it. An exact repair, such as a rename found by its
binding, marks nothing.

The alternative would be the plugin converting its own old values. That was tried and dropped: every change of
shape then needed a new package and new names inside the plugin, a cost paid on every release, for values an
author redraws in minutes. So the one who chose to upgrade carries the risk, with a saved version and a list of
every guess.

## Your rules: `@Migrate`

When a release breaks calls your program makes, Studio never guesses what replaced them. You say it, with a rule
saved in your program, in a class called `Migrations` beside your main class. A rule is a static method marked
`@Migrate`, and its own signature names the old element:

```java
@Migrate(GameScreen.class)                                  // an instance method that changed
static GameScreen marker(@Migrate.Self GameScreen self, ImageTemplate marker) {
    return self.markers(List.of(marker));
}

@Migrate(value = Rect.class, kind = Migrate.Kind.CONSTRUCTOR) // a constructor
static Rect rect(int x, int y) {
    return new Rect(x, y, 0, 0);
}

@Migrate(name = "com.example.Area", kind = Migrate.Kind.TYPE) // a whole type that is gone
static Rect area(int x, int y, int width, int height) {
    return new Rect(x, y, width, height);
}
```

The method's name is the old member's and its parameter types pick the overload; `@Migrate.Self` marks the object
the old method was called on. The kind is `METHOD` (the default), `CONSTRUCTOR`, `FIELD` or `TYPE`. The body is one
expression, compiled against the new release.

Studio **substitutes the rule, it never runs it**: at each use of the old element, it puts that use's own parts
into the rule's body, and checks that the result compiles. All the rewrites go in as one version you can undo.

A plugin may ship rules of its own, for elements it keeps deprecated for one release. Those are listed as
"from <plugin>". They cannot be edited, but **Write my own** writes your rule in their place, and yours wins.

**Project ▸ Migrate…** lists what the new release breaks and the rule each break has: none, seeded or written.
**Write rule** writes a starting rule with the old signature and a body that compiles, marked
`@Refactor("write the replacement")` for you to finish; **Apply** rewrites every use. A rule is removed once
nothing uses the old element.

## Values are copied, not moved

A type rule also carries the plugin's values over when the plugin moved them to another type. Studio **copies**
them: each new value is written beside its original, with the same name, marked `@Migrated`. You switch your code
to the copies, and the originals go only when you remove them. Running the migration again rewrites only the
values still marked.

When an upgrade would drop values, Studio asks before it starts:

- **Migrate first** opens the migration on the version the program has now, so you write the rules and copy the
  values before you move;
- **Upgrade anyway** applies the starting rules as they are, then the repairs above, and marks what it guessed.

## Who is affected

Only the program's author, who chose to upgrade. Somebody who only runs your bot keeps the plugin release its
`pom.xml` pins, until you publish a new version of the bot.
