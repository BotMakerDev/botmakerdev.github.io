---
title: The botmaker command
description: Every botmaker command and its options, from the commands' own help.
sidebar:
  order: 1
---

`botmaker` has two nouns: `plugin` is what extends Studio, `bot` is what you build with it. Each can be created,
tried and published. Every command answers `--help`, which is where this page comes from.

Options every command takes:

| Option | |
|---|---|
| `-h`, `--help` | Show the command's help and exit. |
| `-V`, `--version` | Print the version and exit. |
| `--quiet` | No progress on stderr. |
| `--debug` | Print stack traces as well as the message. |

## botmaker bot

### bot new

```
botmaker bot new [--dir=<path>] [--from=<owner/repo>] [--tag=<tag>] [--package=<pkg>] <name>
```

Create a bot project. With no `--from` it writes a blank project: a pom and one `main()`. With `--from` it clones
that bot at its newest release, linked to its author by the git remote `upstream`.

| Option | |
|---|---|
| `<name>` | The project name. Becomes the folder; for a blank project, the artifactId and the entry class's name too. |
| `--dir` | Where to create it: the project lands in `<path>/<name>`. Default: the current folder. |
| `--from` | Start from a published bot instead of a blank project. |
| `--tag` | Which release of `--from` to start at. Default: its newest. |
| `--package` | The Java package of a blank project. Default: `com.<name>`, lowercased. |

### bot publish

```
botmaker bot publish [--dir=<directory>] [--repo=<owner/name>] [--tag=<tag>] [--dry-run] [patch|minor|major]
```

Run in the bot's folder. Bumps the newest `vX.Y.Z` tag (patch by default; `v0.1.0` first), checks that a catalog
plugin is declared, the bot compiles and a class holds `main`, then tags, releases and opens the pull request
listing it. The catalog's checks merge it when they pass. See [Publish a bot](/docs/how-to/publish-a-bot/).

| Option | |
|---|---|
| `patch`, `minor`, `major` | How the newest tag is bumped. Default: `patch`. |
| `--dir` | The bot project. Default: the current folder. |
| `--repo` | The bot's GitHub repository. Default: the folder's origin, or a new one named after the folder. |
| `--tag` | The version exactly, instead of a bump. One already released is listed as it is. |
| `--dry-run` | Check, print what would be listed, and create or tag nothing. |

### bot unpublish

```
botmaker bot unpublish --repo=<owner/name> [--release=<tag>]
```

Opens the pull request that removes the bot's catalog entry, or with `--release` only that release. Nothing else
changes.

### bot list

List the bots the catalog lists, with their rank.

### bot export

```
botmaker bot export [--dir=<directory>] [--out=<dir>]
```

Write the bot as a `.bmk` file, for people who only run bots. Run it in the bot's folder, at a tagged commit. The
file holds the pom, the icon, the sources and resources, and every jar the bot runs with that Maven Central does not
serve byte for byte; Central's jars are listed and fetched the first time the file opens. `bot publish` makes one
for each release already. See [Run a bot](/docs/how-to/run-a-bot/).

| Option | |
|---|---|
| `--dir` | The bot project. Default: the current folder. |
| `--out` | Where the file is written. Default: the bot's folder. |

### bot run

```
botmaker bot run [<folder>] [--entry=<title>]
```

Run a bot from the terminal, with Studio open or closed. BotMaker's core opens the bot and runs its `main`, or the
run a plugin declares with that toolbar title. The bot's output is printed as it comes, and the end says how the run
ended and where its run log is. Ctrl+C stops the run. Studio must have been started once on this computer.

| Exit code | |
|---|---|
| `0` | The run ended. |
| `1` | The bot did not start: its compile failed, or the start was refused. |
| `2` | The bot could not be opened, or BotMaker's core did not answer. |
| `130` | Stopped by Ctrl+C. |

## botmaker plugin

### plugin new

```
botmaker plugin new [--dir=<directory>] [--owner=<account>] [--package=<pkg>]
                    [--class-prefix=<Prefix>] [--minimal]
                    [--plugin-name=<name>] [--plugin-version=<version>] [--parent=<version>]
                    <artifact-id>
```

Create a plugin project from the example plugin. Every value has a default derived from the artifact id, so the id
alone is a working command line.

| Option | |
|---|---|
| `<artifact-id>` | The Maven artifact id, and the folder's name, e.g. `discord-notifier`. |
| `--dir` | Where to generate. Default: the current folder. |
| `--owner` | The GitHub account the repository goes under; the `groupId` is `com.github.<owner>`. Default: the account `gh` is signed in to. |
| `--package` | The Java package. Default: `com.github.<owner>.<name with no punctuation>`. |
| `--class-prefix` | What the classes are named after: `<Prefix>Plugin`, `<Prefix>Types`, … Default: the artifact id in CamelCase, less a trailing `-plugin`. |
| `--minimal` | A plugin class that declares nothing, its one test, the pom, a changelog and an icon; no example. |
| `--plugin-name` | The name a user reads, the pom's `<name>`. Default: the artifact id, titled. |
| `--plugin-version` | The new project's own version. Default: `0.1.0-SNAPSHOT`. |
| `--parent` | The `botmaker-plugin-parent` version its pom names, which pins the contract and the toolkit together. Default: the release this `botmaker` was built with. |

It also writes `jitpack.yml` and `.jitpack/build.sh`, how JitPack builds the plugin; `plugin publish` refreshes them.

### plugin declare

```
botmaker plugin declare [--dir=<directory>] [--no-build] [<class>]
```

Set the pom's `botmaker.plugin` to the plugin class: the one class extending `DeclaredPlugin` directly, or the one
named when there are several. `plugin validate` suggests it when the property is missing or names another class.

### plugin upgrade

```
botmaker plugin upgrade [--dir=<directory>] [--to=<tag>]
```

Move the pom's `botmaker-plugin-parent` to its newest release (or `--to`'s), then compile and run the checks of
`plugin validate`. The parent pins the contract, the toolkit and JavaFX together.

### plugin validate

```
botmaker plugin validate [--no-build] [--coordinate=<G:A:V>] [<dir>]
```

Run the checks the catalog runs on a plugin. A local pass is not a promise the pull request passes: the catalog
also checks that the published pom declares the coordinate JitPack serves for the repository.

| Option | |
|---|---|
| `<dir>`, `--dir` | The plugin project. Default: the current folder. |
| `--no-build` | Trust the existing `target/classes`. |
| `--coordinate` | Check a published artifact instead of a working copy: catches a plugin that builds on your machine but publishes a pom nobody else can resolve. |

### plugin run

```
botmaker plugin run [--dir=<directory>] [--no-build] [--project=<name>] [--studio=<command>] [--umbrella=<dir>]
```

Build the plugin, add it to a bot project, and open Studio on it. Nothing is tagged or released: `mvn install` puts
the build on your computer, where Maven looks first.

| Option | |
|---|---|
| `--dir` | The plugin project. Default: the current folder. |
| `--no-build` | Skip `mvn install`. |
| `--project` | A project under `~/BotMakerProjects` to add the plugin to. |
| `--studio` | How to launch Studio. Or set `$BOTMAKER_STUDIO`. |
| `--umbrella` | A BotMaker source checkout, whose Studio is started with `javafx:run`. Or `$BOTMAKER_UMBRELLA`. |

### plugin publish

```
botmaker plugin publish [--dir=<directory>] [--repo=<owner/name>] [--tag=<tag>] [--dry-run] [patch|minor|major]
```

Run in the plugin's folder. Bumps the newest `vX.Y.Z` tag (patch by default), checks the plugin, tags and releases
it, waits for JitPack, checks the jar and opens the pull request listing it. The catalog's checks merge it when they
pass. Before tagging it refuses a `-SNAPSHOT` parent, and commits `jitpack.yml` and `.jitpack/` when they differ from
the ones this `botmaker` carries. The options are those of `bot publish`, except that `--repo` must agree with the
folder's origin. See
[Make and publish a plugin](/docs/how-to/make-a-plugin/).

### plugin unpublish

```
botmaker plugin unpublish --repo=<owner/name> [--release=<tag>]
```

Opens the pull request that removes the plugin's catalog entry, or with `--release` only that release.

### plugin list

List the plugins the catalog lists, with their rank.

## Other commands

### doctor

Check the tools the other commands need — Java, Maven, `gh` and Studio — all at once, instead of one at a time
halfway through a build. It reaches no network.

### completion

Print the shell completion script: verbs, options and their values. The rpm and the deb install it already. For a
jar, or to try it in one shell:

```bash
source <(botmaker completion)
```

zsh runs the same script through `bashcompinit`:

```bash
autoload -U +X compinit bashcompinit && compinit && bashcompinit
source <(botmaker completion)
```

### mcp-bridge

```
botmaker mcp-bridge [--studio=<command>] [--umbrella=<dir>]
```

Serve BotMaker's MCP tools over stdio, for an assistant such as Claude Code. In the MCP client's configuration:
`{"type":"stdio","command":"botmaker","args":["mcp-bridge"]}`. It forwards to BotMaker's core on this computer and
starts the core when none is running, so an assistant can open, edit and run a bot with Studio closed. Studio's own
tools appear while Studio is open, and the `start_studio` tool starts it the way `--studio` or `--umbrella` says.
Studio must have been started once on this computer.

### ai

```
botmaker ai <tool> [-C <folder>] [--allow-shell] [-- <tool args>]
```

Start Claude Code (`claude`), Codex (`codex`), Gemini CLI (`gemini`) or opencode (`opencode`) in a bot's folder,
this one unless `-C` names it, with BotMaker's MCP tools through this command's own `mcp-bridge` and the tool's own
file edits turned off, as Studio's Assistant window starts it. `--allow-shell` lets it run shell commands (Codex
always may, in its read-only sandbox). Arguments after `--` go to the tool: `botmaker ai codex -- exec "…"`. The
terminal is the tool's until it exits, and its exit code is this command's, so a script tells this command's own
refusals from the tool's failures by the message on stderr. Before the tool starts, exit 2: not a bot's folder (a plugin's
included), no such tool, or, on Windows with a `.cmd` tool, an argument holding a line break, `"` or `%`; exit 1:
the tool is not installed.

### mcp install

```
botmaker mcp install <claude|codex|opencode|gemini> [--print] [--dev [--umbrella <dir>]]
```

Register BotMaker's MCP server, named `botmaker`, in the tool's user settings, so every session of it has
the tools: Claude Code through `claude mcp add --scope user`, Codex's `~/.codex/config.toml`, opencode's
`~/.config/opencode/opencode.json`, Gemini CLI's `~/.gemini/settings.json`. Only that entry changes; a file it
cannot safely rewrite is left alone, and the entry printed for you to add. `--print` only prints it. The entry
holds this command's path: run it again after an upgrade. `--dev`, for BotMaker's own developers, registers a
checkout's built jar with `--umbrella`; `--umbrella <dir>` implies `--dev`. It turns off no edit: use `botmaker ai`
for that. Both `ai` and `mcp install` come after cli 0.12.0.

### update

```sh
botmaker update
```

Replace this `botmaker` with its latest release. The download is checked against the release's
`checksums_sha256.txt` first. A copy from a package manager, JBang or the Claude plugin is left to them.

## botmaker studio

```sh
botmaker studio [<project>] [--studio=<command>]
```

Start the released Studio on its own, optionally on a project of `~/BotMakerProjects`. What it prints goes to a log
in BotMaker's cache folder, whose path is said. `botmaker studio set --command <command>` says once where Studio
is, if not where its installer puts it.

### studio update

```sh
botmaker studio update [--check] [--studio=<path>]
```

Update the installed Studio to its latest release, the way it was installed: the rpm or deb from its `dnf` or
`apt` repository (or the release's package when there is none), the AppImage replaced in place, the MSI run, the
`.app` replaced from the dmg. Each download is checked against the release's `checksums_sha256.txt`. Root is
asked by `sudo` at a terminal, else `pkexec`. It refuses while Studio runs. `--check` says the installed and latest
versions and how it would update, and installs nothing. Studio's *Help ▸ Check for Updates* does the same.

Releasing BotMaker itself is no longer a `botmaker` command: its maintainers use
[sluice](https://github.com/BotMakerDev/sluice) (`sluice preview`, `sluice release`).
