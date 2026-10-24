---
title: Blocks are Java
description: Why a BotMaker program has no hidden format, and what that buys you.
sidebar:
  order: 1
---

Most block editors keep your program in a format of their own and, at best, export code from it. BotMaker does the
opposite: **the Java file is the program, and the blocks are a way of editing it.** There is no second copy to fall
out of step.

## What Studio does with a block

When you drop a block, Studio does not save a block. It edits the Java file, through the same Java compiler
toolkit an IDE uses (Eclipse JDT), and then draws the file again as blocks. Each statement in the file is one
block; a loop or an `if` is a block that holds others. The palette offers statements; the file can hold anything
Java can, and Studio draws what it understands as blocks and keeps the rest as it is.

Because every edit is an edit to the source, errors are the compiler's own, shown on the block where they are, and
a debugger can stop on a block and step through it.

## What that buys you

- **Nothing to export.** A project is a normal Maven project in `~/BotMakerProjects/<name>/`: a `pom.xml` and
  `src/main/java`. Any Java editor opens it.
- **No ceiling.** Any Java library is one dependency away (**Project ▸ Plugins & Libraries…**), and any line you
  cannot make with blocks you can type.
- **Both ways at once.** Edit the file by hand outside Studio and Studio shows your edit as blocks. Comments and
  helpers you add survive.
- **Your program outlives the editor.** Stop using Studio and you still have a Java program, with its history.

## Where Studio holds back

Studio writes a project's Java itself only when it creates the project. After that, the code is yours. The one
exception is values a plugin owns — the SDK's pictures and screens, say. They live in their own small classes,
marked so the plugin knows them, and change through the plugin's windows rather than on the canvas. Even there,
Studio rewrites only the value itself, never what you wrote around it.
