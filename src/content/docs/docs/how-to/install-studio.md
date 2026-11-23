---
title: Install Studio
description: Where to get Studio for Linux, Windows or macOS.
sidebar:
  order: 1
---

The [install page](/install/) has the steps for your system, with the current version and the exact command or
download. It picks your system for you; the others are a tab away.

- **Linux:** one command for Fedora, RHEL, Debian and Ubuntu, which adds BotMaker's `dnf` or `apt` repositories and
  installs Studio with the `botmaker` command it needs:

  ```sh
  curl -fsSL https://botmakerdev.github.io/botmaker-studio/install.sh | sudo bash
  ```

  Studio then updates with your system (`sudo dnf upgrade`, `sudo apt upgrade`). On Arch, the install page shows
  the AUR command once the AUR lists Studio. Any other distribution takes the AppImage, which needs no root and
  updates itself from inside Studio.
- **Windows** and **macOS:** the installer from Studio's latest release.

However it was installed, Studio updates itself: *Help ▸ Check for Updates*, or `botmaker studio update` with Studio
closed (`--check` only says where it stands). It updates the way Studio was installed — the package from its
repository, the AppImage in place, the MSI, the `.app` from the dmg — and checks each download against the release's
checksums first.

Studio bundles its own Java and JavaFX, so there is nothing else to install. The same page lists the other tools:
the `botmaker` command, the dashboard, and the phone apps.

## Use BotMaker from Claude Code

BotMaker's MCP tools are also a Claude Code plugin. They give you your bots and their runs, plus the Android
emulators on your computer (list, start, install a game, screenshot, tap), with or without Studio open:

```sh
claude plugin marketplace add BotMakerDev/botmaker-claude-plugin
claude plugin install botmaker@botmaker
```

The plugin needs Java 25 or newer: `$BOTMAKER_JAVA`, `$JAVA_HOME` or `java` on your `PATH`. On first use it fetches
the `botmaker` command's jar and checks its sha256.

## Use BotMaker from another AI tool

Every AI tool gets the same MCP tools from the `botmaker` command, and one rule: it changes your bot through
those tools only, and reads files freely. Studio's 🤖 Assistant window starts each tool that way; outside Studio,
start it from the bot's folder with `botmaker ai`:

```sh
cd MyBot
botmaker ai codex          # or opencode, claude, gemini
```

<figure class="shot">
  <img class="only-light" src="/shots/assistant-light.webp" alt="Studio's Assistant window: the AI tool picked, every tool call of the session listed with how often it was used, and one edit_code call with its arguments and reply." loading="lazy" />
  <img class="only-dark" src="/shots/assistant-dark.webp" alt="" loading="lazy" />
  <figcaption>The <b>🤖 Assistant</b> window lists every call an AI tool made, with its arguments and what Studio answered.</figcaption>
</figure>

`botmaker ai` points the tool at BotMaker, with or without Studio open, and turns off its own file edits; it says
which before handing you the terminal. `--allow-shell` lets the tool run shell commands too. To give it one task
and get the answer, pass the tool's own arguments after `--`, on one line:

```sh
botmaker ai codex -- exec "open this bot and add a print of hello at the end of main"
botmaker ai opencode -- run "list my projects"
```

On Windows, where npm installs the tool as a `.cmd`, such an argument may not hold a line break, a `"` or a `%`:
`botmaker ai` refuses it rather than let Windows change it.

### Codex

Install it with `npm install -g @openai/codex` and log in with `codex login`. Under `botmaker ai codex` it runs in
its read-only sandbox: it can read and run commands, not write files. Started by hand in the bot's folder, Codex
reads the folder's `.codex/config.toml`, which asks for that sandbox too, only once you trust the folder in Codex.

### opencode

Install it (`curl -fsSL https://opencode.ai/install | bash`, or `npm install -g opencode-ai` on Windows) and log in
with `opencode auth login`; it runs any model, a local one too.
Under `botmaker ai opencode` its edits and shell commands are denied (shell asks first with `--allow-shell`).
Started by hand, it reads the folder's `opencode.json`: edits denied, shell asks first.

### Claude Code

The plugin above, or `botmaker ai claude`: Edit and Write are denied, and shell commands unless `--allow-shell`.
Started by hand, it reads the folder's `.claude/settings.json`, which denies edits under `src`.

### Gemini CLI

`botmaker ai gemini` excludes its `write_file` and `replace` tools (and its shell unless `--allow-shell`). This has
not yet been tried against an installed Gemini CLI.

### Your own sessions

To have the tools in every session of a tool you start yourself, register them once:

```sh
botmaker mcp install codex   # or opencode, claude, gemini; --print shows the entry instead
```

This changes only BotMaker's entry in the tool's own settings; run it again after you move or upgrade the
`botmaker` command, whose path the entry holds. It turns nothing off: in a bot's folder Studio opened,
leaves `AGENTS.md` and each tool's file saying to work through the tools, and those keep a tool from slips, not
from a determined one. `botmaker ai` is the guarded way.

Next: [your first program](/docs/tutorials/first-program/).
