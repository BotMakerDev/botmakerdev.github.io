---
title: Values are Java
description: Why a plugin's value is an ordinary call in the bot, and why Studio, not the plugin, writes it.
sidebar:
  order: 4
---

A bot that clicks a picture holds that picture somewhere. Many tools would keep it in a file of their own, JSON or a
database, and look it up by a name. BotMaker keeps it where the rest of the program is: in the Java, as a call.

```java
Greeting.to("world").times(3)
```

That line is the value. There is no second copy of it anywhere.

## Why a call

- **The compiler checks it.** A renamed method or a missing part is a compile error on the line that holds it,
  not a lookup that fails while the bot runs.
- **It goes where Java goes.** You can read it, diff it, review it in a pull request, and copy it to another bot.
  Your history has every change to it.
- **Anyone can write it.** A person who prefers typing writes the same call by hand. Studio reads it as if it had
  written it.
- **It needs no reader.** At run time it is plain Java: the bot calls `Greeting.to("world")` and has its greeting.
  Nothing parses a file first.

[Blocks are Java](/docs/explanation/blocks-are-java/) says the same of the program around the value.

## Studio owns the syntax, both ways

A plugin does not read or write the calls of its values. It declares, once, which call its type is written as
([Declare a plugin's values](/docs/how-to/declare-values/)). From that, Studio does both directions:

1. **Reading.** Studio finds the call in the source, reads each argument, and calls the plugin's factory with them.
   The plugin's editor is handed a `Greeting`, never text.
2. **Writing.** The editor hands back a new `Greeting`. Studio takes it apart through the same declaration and
   writes the call, with each link only where it changes the value.

So a plugin does not quote strings, add imports or parse calls, and cannot disagree with Studio about any of them.
When the Java grammar grows, Studio learns it once, for every plugin. One narrow exception: a part that is itself
code, such as a method reference a value holds, crosses as the text Studio read, and the plugin turns that text
back into the part.

## The round trip

The declaration is checked by one law: **take a value apart, build it back, take it apart again, and you get the
same parts.** If the parts changed on the way, Studio would write something different from what it read, and the
bot's file would change on every save without anyone editing it. `botmaker plugin validate` runs that trip on each
type's fresh value and refuses a declaration that fails it. It compares parts, so a type needs no `equals` for it.

Equality picks the call. A class built by several factories is declared once per factory. Studio writes a value
with the first declaration that builds it back equal, and with the first that writes it when none does. For a type
with `equals`, such as a record, the plugin seldom needs to say which.

## Names, checked at the plugin's build

The short form pairs a factory's parameter with the accessor of the same name, and a `@Link` method with its
reader. Matching by name sounds fragile, but it is name **and** type, and it is checked when the plugin builds:
`mvn verify` builds every declaration, and one that does not pair is refused with a message naming the part. A
mistake stops the plugin's author, never a bot. The explicit form stays for types whose names do not pair, such as
the JDK's.

## What Studio cannot read stays as written

Not every expression is a call Studio knows. A variable, a helper method, a computed value: Studio reads none of
them as a value. It does not guess and it does not rewrite them. The editor shows the expression read-only, and the
code stays exactly as its author wrote it.

## Changing the shape

Because a value is code, a plugin that changes its API changes the bot's code. Studio's upgrade repairs it the way it
repairs any other code: rules the plugin ships with its release rewrite old calls into new ones. See
[How upgrades repair a program](/docs/explanation/upgrades/).
