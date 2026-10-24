---
id: com.botmaker.sdk
repo: BotMakerDev/botmaker-sdk
name: BotMaker SDK
summary: Game automation. Screens, pictures, reading text, flows and activities, the run overlay.
headline: Let a program play
emphasis: the repetitive part.
features:
  - title: Screens map
    text: Every screen of the game and the ways between them. Say where to go, and the bot walks there.
    alt: The SDK's map window in Studio, with a game's screens as boxes and arrows between them.
  - title: Pictures
    text: Cut a button out of a screenshot. The bot finds it on the screen, even when the window is another size.
    alt: A picture being cut out of a game screenshot in Studio.
  - title: Reading text
    text: Numbers and labels read straight off the screen, ready to compare.
    alt: A readout on a game screen, with the number the SDK read from it.
  - title: Flows and activities
    text: What to do, in what order, how often. Whoever runs the bot switches activities on and off.
    alt: A flow in Studio, its activities as cards joined by arrows.
  - title: Launching the game
    text: Start the game the way you already do, with Steam, Bottles, Waydroid or a phone over adb. On Linux it can run in a private session, so your desktop stays yours.
    alt: The launch settings in Studio, with a game picked to start before the bot runs.
  - title: Run overlay
    text: Watch it work, step by step, with what it matched and where it clicked. One key stops it, always.
    alt: A game window during a run, with the SDK's match boxes and step list drawn over it.
---

The SDK turns Studio into a workshop for game bots. You show it what the screens look like; it finds its way
around, clicks, reads and waits, and shows you everything it sees while it runs.

Everything it adds is Java in your bot: a screen is a class, a picture is a constant, a step is a call. Open the
code and it reads like any other Java program.

To use it, open a project's **Plugins & Libraries** and add the SDK. It brings the
[Basics plugin](/plugins/com.botmaker.basics/) with it.
