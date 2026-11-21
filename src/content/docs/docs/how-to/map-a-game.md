---
title: Map a game's screens
description: Tell an SDK bot which screen the game shows, what each button does and what its looks mean.
sidebar:
  order: 7
---

A bot made with the [SDK](/plugins/BotMakerDev/botmaker-sdk/) walks its game by a map: its `Screens` class, one
constant per screen, written for you by 🗺 **Screens** and by the assistant. This guide says how a screen is told
apart, how a button with no picture of its own is pressed, how the bot learns what a button's looks mean, and how
to check the whole map against the game, and how to tell the bot what it wants.

<figure class="shot">
  <img class="only-light" src="/shots/screens-map-light.webp" alt="The Screens window: a game's seventy screens as thumbnails in rows, each joined to the screens its buttons lead to." loading="lazy" />
  <img class="only-dark" src="/shots/screens-map-dark.webp" alt="" loading="lazy" />
  <figcaption>🗺 <b>Screens</b> on a mapped game: each screen as the game shows it, and the ways between them. ⋯ ▸ <b>Tidy</b> lays the cards out again.</figcaption>
</figure>

## 1. Tell each screen by its parts

A screen is told by **its parts that mark**: a picture, words or an app's element only it shows. In 🗺 Screens, pick
a screen and mark a part as a marker; a part can also be marked **absent**, one the screen never shows while a
look-alike does. A button can mark its screen too, and it still does while it shows another look (selected,
dimmed). Two screens may share a part: the whole set tells them apart.

Under **What the map cannot do**, the map says when two screens have the same set, or when one set sits inside
another, and names the part to add.

Bots made before November 2026 kept their markers in lists on the screen's setup. They move to parts the next time
the screen is saved, or all at once when the assistant runs `edit_map move_markers`.

## 2. Press what has no picture of its own

A slot whose content changes, such as an equipment slot showing whatever item is in it, has no fixed picture. Add it
as a **spot**: a place beside a stable picture (an anchor), measured in the anchor's width and height. It is
pressed only when the anchor is found, so the bot never clicks blind on another screen. The assistant does it with
`edit_map add_spot`, then tries the spot by its field name.

## 3. Let the bot learn what a look means

Games show a button's state by its look: dimmed while it cannot be used, brightened when it is selected, lit
while the pointer is over it. Do not cut each look as a picture of its own. The bot learns them as **shades**,
kept in `Sdk.shades()`:

- **What the game shows.** When two buttons show the same change from their cut pictures, `which_screen` proposes
  a shade. Ask the assistant to keep it (`edit_map learn_shade`), and pick what it means: *Disabled*, *Selected*, or a state of your bot's own (`States`), such as *Maxed*. A run never
  presses a button shown in a state that blocks it.
- **How buttons answer the bot.** In a screen's *How buttons answer the bot*, **Try on this screen** hovers,
  holds and Tabs two buttons, and proposes each change they show alike: keep it, and a run takes that look for the
  button as usual. The assistant does it with `edit_map learn_interactions`. A game that acts the moment a button
  is touched takes the hold as a press: the try stops there and keeps what it saw before.

## 4. Check the map

A game update moves a button or redraws a screen, and the bot's map is wrong until you notice. **Explore map**, in
🗺 Screens' 🔭 Explore (the ▾ beside ▶ Keep exploring), checks it for you: it starts the game and walks the whole
map without your bot's `main`, every screen and every way between screens once.

It says what did not go as the map says:

- **Edge missed** (a warning): a button led elsewhere, to no screen of the map, or not in time.
- **Pictures changed** (an error): the screen a button led to matched none of the map's screens, so its pictures
  no longer match the game.
- **Never reached** (an error): no way the walk could take led to that screen.

It ends with one line of counts, such as *Map check: 14/16 screens, 31/35 edges, 3 not tried*. A way whose
condition says no, whose button is locked, greyed out or in another look than it needs, or a way back with no
button is **not tried**: it is not a problem. A screen behind a tutorial or an event the game is not showing now is
often never reached; that is the map waiting for the game, not a broken map.

The walk is never stuck for ever: each way gets 30 s, the whole walk 30 minutes and 5 game restarts. Press **■ Stop**
at any time: what it found so far is kept. Its problems reach the end-of-run dialog and the
[Reports tab](/docs/how-to/read-your-bots-reports/) like any run's; *Failed moves* shows the ways that did not
arrive. The assistant runs it with `run_bot entry="Explore map"` and reads the result with `reports`.

## 5. Say what the bot wants

A map says how to get somewhere; a **plan** says where to go. A bot does not list every step: it says what it wants,
and a run picks the next thing to do itself.

- **Facts.** What the game shows is kept as facts, the methods of a `@Facts` group such as `Progress`. A screen's
  readout says where each one is read and how long a reading holds:
  `Readout.digits(Area.of(Pictures.GOLD_ICON, 1.2, 0, 3, 1), Digits.GOLD).into(Progress::gold).staleAfter(Duration.ofMinutes(30))`.
  The `Area` is measured from a picture the screen shows: here 1.2 of the gold icon's widths right of it, 3 icons wide
  and 1 high, so it follows the icon at any size. You never type those numbers: cut the icon (or pick one already
  saved), then cut the number beside it, and Studio works them out.
- **Actions.** What is done on a screen is a `Do` beside the button it presses, with the goals it serves:
  `Do.press(claim).serves(Goals.CLAIMED_TODAY).daily(LocalTime.of(5, 0))`. `.needs`, `.first`, `.last`, `.over`,
  `.every` and `.once` say when it is a choice. One marked `.onSight()` is done whenever a walk passes its screen,
  such as closing an ad.
- **Goals**, in `Goals.java`, are checks: `Goal.of(Need.atLeast(Progress::gold, 100))`, or
  `Goal.done(() -> Screens.HOME.claim).within(Duration.ofDays(1))`.
- **Plans**, in `Plans.java`, are tiers of goals: `Plan.of(Plan.tier(Goals.RESTED), Plan.tier(Goals.CLAIMED_TODAY,
  Goals.ENOUGH_GOLD))`. The first tier with a goal left to do is worked on first.

Work a press cannot say, such as a puzzle or a fight, is a `Custom` input on its screen,
`Custom.of(MyBot::solvePuzzle)`: a plain method of yours, pressed like a button.

The bot's `main` calls `Bot.run(Sdk.class)`. Pick the plan under **plan** in the Runner. A run walks to the best action, reads a fact it does not know on the
way, presses, checks the goal, and waits until the next goal comes due. Each decision is a line of the run's trace.

🎯 **Goals**, in the left rail of 🗺 Screens, shows a plan as a run sees it: the tiers as rows of goal chips, one card per
goal with the actions serving it in the order a run tries them, and the route to the action you pick. Drag a chip to
another tier, or a row onto another to try it first. **+ Goal** and **+ Plan** write new ones. A ⚠ line names what
no run can do: a goal no action serves, `.over`s that go round in a circle, goals that need each other too deeply.

When the assistant presses a button with `try_input` and a goal's fact turns true, it proposes the `.serves` to add,
and 🗺 Screens badges the button 🎯. Nothing is written until you add it.
