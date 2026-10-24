---
title: Launch a game for a bot
description: Tell an SDK bot which game to start and where it runs.
sidebar:
  order: 5
---

A bot made with the [SDK](/plugins/com.botmaker.sdk/) starts its game before it plays. It starts it the way you
already do, through the launcher that has it: BotMaker adds no launch settings of its own. This guide picks the
game, says which window the bot watches, and chooses where the game runs.

## 1. Pick the game

Press the toolbar's 🎮 game button (**Choose game** until a game is picked; then it shows the game's name). The
window shows the games this computer's launchers and app menu already list, as covers. The row of choices at the
top narrows them: **All**, **Recent**, one per launcher (Steam, Epic, Heroic, Faugus, Lutris, GOG…), one per
Android emulator instance, Waydroid's apps and the menu's games.

Pick the game. It joins the list of games the bot supports, shown as pills above the covers; the first one is the
one you prefer, and **✕** removes one. **▶ Launch game** starts it without running the bot, to check it starts.

Some games need one more step:

- **A Windows game with no launcher:** **Add a Windows program…** puts its `.exe` into Faugus, with Faugus's own
  defaults, and Faugus starts it from then on. A program in a [Bottles](https://usebottles.com/) bottle is
  started with Bottles.
- **An Android game not installed yet:** search Google Play for it, or **Install from file…** for an APK, and pick
  the instance to install it on. Studio starts the instance first if it is stopped.
- **A game on a phone:** connect the phone over `adb`. Phones are listed under **Phones** in 🎯 Capture Source,
  by serial number.

Before a launch, Studio checks that the game can start: it waits out a download the launcher is running, offers
to open a launcher that is signed out, and offers to install a game that is not installed.

## 2. Point the bot at the game's window

Press 🎯 **Capture Source**. Pick the game's window from **Windows**, an emulator from **Emulators**, a whole
monitor or the desktop. If the game is not open yet, **▶ Launch and pick…** starts it and recommends the window it
opens. Everything the bot looks for is looked for there.

## 3. Choose where the game runs

Open ⚙ **Bot Settings**, section **Run the game in**:

- **A private display** (Linux, and the default there): the game runs on a display of the bot's own and never
  appears on your desktop, so you keep using your computer. Steam, Heroic and Faugus run one copy per user, so if
  one is already open on your desktop, Studio offers to close it before the launch.
- **My desktop:** you watch the bot work, and share the screen with it. Events go to the game's window; if a game
  ignores them, tick **Take over the mouse and keyboard**, and the pointer moves to each click and back.
- **A virtual machine** (Windows, and a Mac with Apple Silicon and macOS 14 or later): the game runs in a virtual
  machine Studio set up, and you keep using your computer. On an older Mac, the game runs on your desktop.

## Who picks, the author or the runner

The games the bot supports are its author's list. Somebody who only runs the bot picks one of them in the bot's
**Runner** window (to see it as they do, press **👁 Preview**). With no pick, a run starts the first game on the
list that this computer can launch. Both are plain Java in the bot's `Sdk.java`:

```java
@SdkValue(SdkValue.Id.LAUNCH_TARGETS)
@Param(category = "Game", visibility = Param.EDITOR, description = "The games this bot supports, preferred first")
public static List<Launcher> launchTargets = List.of(/* the games you picked */);

@SdkValue(SdkValue.Id.LAUNCH_TARGET)
@Param(category = "Game", visibility = Param.PUBLIC, description = "Which of the bot's games this computer launches")
public static LaunchChoice launchTarget = LaunchChoice.of("");
```
