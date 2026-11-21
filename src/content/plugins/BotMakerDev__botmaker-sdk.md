---
repo: BotMakerDev/botmaker-sdk
name: BotMaker SDK
summary: Game automation. Screens, pictures, reading text, goals and plans, the run overlay.
headline: Let a program play
emphasis: the repetitive part.
features:
  - title: Screens map
    text: Every screen of the game and the ways between them. Say where to go, and the bot walks there.
    alt: The SDK's Screens window in Studio, a game's seventy screens as thumbnails in rows, joined by the ways between them.
    src: /shots/screens-map-light.webp
    srcDark: /shots/screens-map-dark.webp
  - title: Pictures
    text: Cut a button out of a screenshot and it becomes a constant of your bot's Pictures class. The bot finds it on the screen, even when the window is another size.
    alt: A game bot's Pictures class in Studio, each picture a constant shown as the image it holds.
    src: /shots/bot-pictures-light.webp
    srcDark: /shots/bot-pictures-dark.webp
  - title: Reading text
    text: Numbers and labels read straight off the screen, ready to compare.
    alt: The game's top bar with gold, gems, energy and power boxed, beside the Progress facts the SDK read from them.
    src: /shots/reading-light.webp
    srcDark: /shots/reading-dark.webp
  - title: Goals and plans
    text: Say what the bot wants, in tiers of what matters most. It picks the next action itself, and whoever runs the bot picks the plan.
    alt: The Screens window's Goals view, a plan's three tiers of goals, each with its check, its action and whether it is met.
    src: /shots/goals-light.webp
    srcDark: /shots/goals-dark.webp
  - title: Launching the game
    text: Start the game the way you already do, with Steam, Bottles, Waydroid or a phone over adb. On Linux it can run in a private session, so your desktop stays yours.
    alt: Studio's Game window, with Sword x Staff picked on Waydroid, the emulator's checks passed, and the Lutris games of this computer to pick from.
    src: /shots/launch-light.webp
    srcDark: /shots/launch-dark.webp
  - title: Run overlay
    text: Watch it work, step by step, with what it matched and where it clicked. One key stops it, always.
    alt: A game window during a run, with the SDK's match boxes and step list drawn over it.
    src: /shots/run-overlay.webp
---

The SDK turns Studio into a workshop for game bots. You show it what the screens look like; it finds its way
around, clicks, reads and waits, and shows you everything it sees while it runs.

Everything it adds is Java in your bot: a screen is a class, a picture is a constant, a step is a call. Open the
code and it reads like any other Java program.

To use it, open a project's **Plugins & Libraries** and add the SDK. It brings the
[Basics plugin](/plugins/BotMakerDev/botmaker-plugin-basics/) with it.
