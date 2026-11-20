---
title: Your first program
description: Install Studio, start a blank project, add a few blocks, look at the Java they are, and run it.
sidebar:
  order: 1
---

In this tutorial you will make a program that prints a line three times. It takes about ten minutes, and you need
nothing but Studio: it brings its own Java.

<video controls muted playsinline preload="none" poster="/video/blocks-demo-poster.webp"
       aria-label="The steps of this tutorial in Studio: a new blank bot, a counting loop and a Print added, then a run.">
  <source src="/video/blocks-demo.webm" type="video/webm" />
  <source src="/video/blocks-demo.mp4" type="video/mp4" />
</video>

*Similar steps in Studio, 20 seconds: there the bot is called `HelloLoop`, and its last line prints `Done!`.*

## 1. Install Studio

Open the [install page](/install/). It picks your system and shows the one download or command you need. Install
Studio, then start it.

## 2. Start a blank project

Studio opens on its list of bots, **My bots**.

1. Press **＋ New bot**. The *Create New Project* window opens.
2. Type a name: `MyFirstProject`. A name starts with a letter and holds only letters and digits.
3. Under *Start from*, keep **Blank** picked. Leave the *Plugins* cards unticked: this program needs none.
4. Press **Create**.

Studio creates the project in `~/BotMakerProjects/MyFirstProject/` and opens its one class, `MyFirstProject`, on
the canvas. The purple block is its `main`, the place a Java program starts, and it already holds one block:
**Print** `Hello from MyFirstProject!`.

## 3. Add blocks

Blocks are added where they go. Hover over the gap above or below a block and a **+** shows; press it, or press
**+ Add a block** in an empty body, and a menu of blocks opens. Type in its *Search blocks…* field to find one.

1. Press the **+** above the Print block and pick **Counting Loop**. It counts `i` from `0` while `i` is less than
   `10`. Click the `10`, type `3`, then click another field, such as the Print's text: a number is kept only when
   you leave its field.
2. Press **+ Add a block** inside the loop and pick **Print**.
3. Click the new Print's value and type `Hello, world!`. Its field is text, so Studio writes the quotes for you.

If a block shows a red mark, Studio found an error in it. Hover over the mark to read what is wrong.

## 4. Look at the Java

Those blocks are not a picture of a program. They are the program. Open the project's folder and the file
`src/main/java/com/myfirstproject/MyFirstProject.java` in any text editor:

```java
package com.myfirstproject;

public class MyFirstProject {
    public static void main(String[] args) {
        for (int i = 0; i < 3; i++) {
            System.out.println("Hello, world!");
        }
        System.out.println("Hello from MyFirstProject!");
    }
}
```

Every block is one statement of that file, and every change you make on the canvas is a change to it. You can edit
the file by hand too: it is plain Java, and Studio redraws it as blocks.

## 5. Run it

Press **▶ Run** on the toolbar. Studio compiles the project and runs it: the *Run* pane below the canvas shows
`Hello, world!` three times, then the starting line, and the status bar says *Program completed successfully*.

## What next

- Try the other blocks in the menu: each writes one Java statement.
- To get more blocks, add a plugin in **Project ▸ Plugins & Libraries…**. The [Plugins](/plugins/) page says what
  each one brings.
- When your program is worth sharing, [publish it](/docs/how-to/publish-a-bot/) so anybody can start from it.
