---
title: Your first program
description: Install Studio, start a blank project, snap a few blocks together, look at the Java they are, and run it.
sidebar:
  order: 1
---

In this tutorial you will make a program that prints a line three times. It takes about ten minutes, and you need
nothing but Studio: it brings its own Java.

## 1. Install Studio

Open the [install page](/install/). It picks your system and shows the one download or command you need. Install
Studio, then start it.

## 2. Start a blank project

Studio opens on its list of projects.

1. Press **Create New Project**.
2. Type a name: `MyFirstProject`. A name starts with a letter and holds only letters and digits.
3. Choose **Blank — a main() and nothing else**. Leave the *Plugins* list unticked: this program needs none.
4. Press **Create**.

Studio creates the project in `~/BotMakerProjects/MyFirstProject/` and opens its one class, `MyFirstProject`, on
the canvas. The block you see is its `main`: the place a Java program starts.

## 3. Snap blocks together

1. In the palette, find **Counting Loop** and drag it into `main`. Set its count to `3`.
2. Find **Print** and drag it *inside* the loop.
3. Click the Print block's value and type `"Hello from my first program"`, with the quotes: it is a piece of text.

If a block shows a red mark, Studio found an error in it. Hover over the mark to read what is wrong; a missing
quote is the usual one.

## 4. Look at the Java

Those blocks are not a picture of a program. They are the program. Open the project's folder and the file
`src/main/java/com/myfirstproject/MyFirstProject.java` in any text editor:

```java
package com.myfirstproject;

public class MyFirstProject {
    public static void main(String[] args) {
        for (int i = 0; i < 3; i++) {
            System.out.println("Hello from my first program");
        }
    }
}
```

Every block is one line of that file, and every change you make on the canvas is a change to it. You can edit the
file by hand too: it is plain Java, and Studio reads it back as blocks.

## 5. Run it

Press **▶ Run** on the toolbar. Studio compiles the project and runs it, and the three lines appear in the run's
output.

## What next

- Try the other blocks in the palette: each writes one Java statement, and the Java beside it never hides.
- To add more blocks to the palette, add a plugin in **Project ▸ Plugins & Libraries…**. The
  [Plugins](/plugins/) page says what each one brings.
- When your program is worth sharing, [publish it](/docs/how-to/publish-a-bot/) so anybody can start from it.
