---
title: Your first game bot with the SDK
description: A bot that plays the repetitive part of a game, built with the BotMaker SDK plugin.
sidebar:
  order: 2
---

In this tutorial you will make a bot that comes back to a game every ten minutes and clicks its reward button. You need Studio, a game you can start on this computer, and about twenty minutes. If you have never used
Studio, do [Your first program](/docs/tutorials/first-program/) first: this one assumes you know the canvas.

## 1. Start a project with the SDK

1. On Studio's **My bots**, press **＋ New bot**.
2. Name it `MyFirstBot` and choose **Blank**.
3. In the *Plugins* list, tick **BotMaker SDK**. It brings the [Basics](/plugins/BotMakerDev/botmaker-plugin-basics/) plugin with
   it.
4. Press **Create**.

The toolbar's second row now has a **BotMaker SDK** tab with the SDK's buttons: 🎮 for the game, 📋 **Project Setup**, 🎯 **Capture Source**, ⚙ **Bot Settings**,
🗺 **Screens**, 🎯 **Goals**, 🖼 **Manage Pictures** and 🎮 **Pilot**. Project Setup lists what
the bot still needs before it can run; it is a good place to come back to. To find any button by name, press
**Ctrl+Shift+A** (**Navigate ▸ Find Action**).

## 2. Pick the game

Press the toolbar's 🎮 **Choose game**. The window shows the games your launchers already know (Steam, Heroic,
Faugus, Lutris, Waydroid, the app menu) as covers. Pick yours and press **▶ Launch game** to check that it starts.
How the game is started, and where it runs, is covered in [Launch a game for a bot](/docs/how-to/launch-a-game/).

## 3. Point the bot at the game's window

Press 🎯 **Capture Source** and pick the game's window from the **Windows** tiles. If the game is not open,
**▶ Launch and pick…** starts it and recommends the window it opens. From now on, everything the bot looks for is
looked for in that window, and every click lands in it.

## 4. Cut out the button

Press 🖼 **Manage Pictures** and cut a new picture: drag a box around the button the bot should click and name the
picture `COLLECT`.

The picture is a PNG in `src/main/resources/images/`, and the bot knows it by a constant in its own Java:

```java
public static final ImageTemplate COLLECT = new ImageTemplate("images/collect.png");
```

That line is in `Pictures.java`, which the SDK keeps for you in the package `plugins.com_github_botmakerdev.botmaker_sdk`
under your main class's. 🖼 **Manage Pictures** renames or recuts a picture,
and a rename carries every block that uses it.

## 5. Put the button on the map

The bot does not follow a script. It knows the game's screens, what it wants, and the actions that get it there.

Press 🗺 **Screens** and add the screen the button is on, `Home`, with the pictures that tell it apart. Give it the
button `COLLECT`, and an action that presses it. The map is Java in `Screens.java`, beside `Pictures.java`:

```java
public static final class Home extends Screen {
    public final Button collect = Button.of(Pictures.COLLECT);
    public final Do claim = Do.press(collect).serves(Goals.CLAIMED_LATELY);
    // … the pictures that say the game is on Home
}
```

`Do` is an action. `serves` says which goal it moves forward. Work a press cannot say, such as a puzzle, is a
`Custom` input on the screen: a plain method of yours, `Custom.of(MyFirstBot::solvePuzzle)`.

## 6. Say what the bot wants

Press 🎯 **Goals**. Add a goal that is met when `claim` went through in the last ten minutes, and a plan with that
goal in its first tier. They are Java too, in `Goals.java` and `Plans.java`:

```java
public static final Goal CLAIMED_LATELY = Goal.done(() -> Screens.HOME.claim).within(Duration.ofMinutes(10));

public static final Plan COLLECT = Plan.of(Plan.tier(Goals.CLAIMED_LATELY));
```

A plan is tiers of goals. Each round the bot takes the first tier with a goal that is not met, walks the map to an
action that serves it, and presses it. When nothing is due, it waits for the soonest goal that will be.

## 7. Run it

The bot's `main` starts the run. Open `main`: while it calls nothing, its block menu opens on **START THE BOT**
with **▶ Run the bot's plan** (`Bot.run(Sdk.class)`). Add it. Pick `COLLECT` under **plan** in the Runner (▶ **Run…**),
then run.

The run overlay draws over the game what the bot matched and where it clicked, and lists its steps. To stop the
bot at any moment, from anywhere, press **Pause** (**F12** on a Mac); **View ▸ Stop Key** changes the key.

## What next

- Map more screens and the buttons between them: the bot walks the map to wherever an action is.
- Add goals that read the game, such as gold at least 100, and order them in tiers: [Map a game](/docs/how-to/map-a-game/).
- [Blocks of the SDK](/docs/reference/sdk-blocks/) lists every block the SDK adds.
- When the bot works, [publish it](/docs/how-to/publish-a-bot/).
