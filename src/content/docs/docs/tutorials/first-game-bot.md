---
title: Your first game bot with the SDK
description: A bot that plays the repetitive part of a game, built with the BotMaker SDK plugin.
sidebar:
  order: 2
---

In this tutorial you will make a bot that clicks one button in a game, over and over, and stops when the button
is gone. You need Studio, a game you can start on this computer, and about twenty minutes. If you have never used
Studio, do [Your first program](/docs/tutorials/first-program/) first: this one assumes you know the canvas.

## 1. Start a project with the SDK

1. On Studio's list of projects, press **Create New Project**.
2. Name it `MyFirstBot` and choose **Blank**.
3. In the *Plugins* list, tick **BotMaker SDK**. It brings the [Basics](/plugins/com.botmaker.basics/) plugin with
   it.
4. Press **Create**.

The toolbar now has the SDK's buttons: 🎮 for the game, 🎯 **Capture Source**, ✂ **Capture Templates**,
🖼 **Manage Pictures**, 🔀 **Activity Flow**, 🗺 **Screens**, ⚙ **Bot Settings** and 📋 **Project Setup**. Project
Setup lists what the bot still needs before it can run; it is a good place to come back to.

## 2. Pick the game

Press the toolbar's 🎮 **Choose game**. The window shows the games your launchers already know (Steam, Heroic,
Faugus, Lutris, Waydroid, the app menu) as covers. Pick yours and press **▶ Launch game** to check that it starts.
How the game is started, and where it runs, is covered in [Launch a game for a bot](/docs/how-to/launch-a-game/).

## 3. Point the bot at the game's window

Press 🎯 **Capture Source** and pick the game's window from the **Windows** tiles. If the game is not open,
**▶ Launch and pick…** starts it and recommends the window it opens. From now on, everything the bot looks for is
looked for in that window, and every click lands in it.

## 4. Cut out the button

Press ✂ **Capture Templates** and choose **▢ Capture one**. Drag a box around the button the bot should click and
name the picture `COLLECT`.

The picture is a PNG in `src/main/resources/images/`, and the bot knows it by a constant in its own Java:

```java
public static final ImageTemplate COLLECT = new ImageTemplate("src/main/resources/images/collect.png");
```

That line is in `Pictures.java`, which the SDK keeps for you. 🖼 **Manage Pictures** renames or recuts a picture,
and a rename carries every block that uses it.

## 5. Make an activity

An activity is one thing the bot does, ending with an *outcome* that says how it went.

1. Press 🔀 **Activity Flow**, then **Add activity**.
2. Name it `Collect`. Its outcomes start with `NEXT`; add a second one, `NOTHING_LEFT`.
3. Press **Create**. The activity is a card on the canvas, with one port per outcome.
4. Select the card. In its **Runs** row, press **Create method…**: Studio writes the activity's body, a function
   that returns one of its outcomes, and opens it on the canvas.

Fill the body with blocks. Under **FROM PLUGINS ▸ BotMaker SDK** in the block menu, each class of the SDK has its
own submenu. Build this:

1. An **If Statement** whose condition is *not* **ImageClicker ▸ click** with the picture `COLLECT`, and inside
   it a **Return** of `NOTHING_LEFT`. The click answers whether it found the picture.
2. After it, **Wait ▸ seconds**, set to one second.
3. Last, a **Return** of `NEXT`.

In Java, that is:

```java
public static Activities.Collect body() {
    if (!ImageClicker.click(Pictures.COLLECT)) {
        return Activities.Collect.NOTHING_LEFT;
    }
    Wait.seconds(1.0);
    return Activities.Collect.NEXT;
}
```

Back in 🔀 Activity Flow, drag the card's `NEXT` port onto the card itself, so the bot collects again. Leave
`NOTHING_LEFT` unwired: an outcome with nowhere to go ends the run.

## 6. Run it

The bot's `main` starts the flow. Open `main`: while it calls nothing, its block menu opens on **START THE BOT**
with **▶ Run activity flow**. Add it, then press **▶ Run** on the toolbar.

The run overlay draws over the game what the bot matched and where it clicked, and lists its steps. To stop the
bot at any moment, from anywhere, press **Pause** (**F12** on a Mac); **View ▸ Stop Key** changes the key.

## What next

- 🗺 **Screens** maps the game's screens and the ways between them, so the bot can walk to a screen by name
  (`Navigate.to`) instead of clicking its way there.
- More activities, wired outcome to card, make a loop: collect until nothing is left, then fight, then rest.
- [Blocks of the SDK](/docs/reference/sdk-blocks/) lists every block the SDK adds.
- When the bot works, [publish it](/docs/how-to/publish-a-bot/).
