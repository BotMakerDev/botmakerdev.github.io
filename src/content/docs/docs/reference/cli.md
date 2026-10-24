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
that bot at its newest release, linked to its author by the git remote `original`.

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

## botmaker plugin

### plugin new

```
botmaker plugin new [--dir=<directory>] [--group=<group>] [--package=<pkg>] [--plugin-id=<id>]
                    [--plugin-name=<name>] [--plugin-version=<version>] [--studio-api=<version>]
                    [--toolkit=<version>] <artifact-id>
```

Create a plugin project from the example plugin. Every value has a default derived from the artifact id, so the id
alone is a working command line.

| Option | |
|---|---|
| `<artifact-id>` | The Maven artifact id, and the folder's name, e.g. `discord-notifier`. |
| `--dir` | Where to generate. Default: the current folder. |
| `--group` | The `groupId`. Default: `com.example`. |
| `--package` | The Java package. Default: `<group>.<name with no punctuation>`. |
| `--plugin-id` | The plugin's id; must be unique in the catalog. Default: `<group>.<name>`. |
| `--plugin-name` | The name a user reads. Default: the artifact id, titled. |
| `--plugin-version` | The new project's own version. Default: `0.1.0-SNAPSHOT`. |
| `--studio-api`, `--toolkit` | The contract and toolkit versions in its pom. Default: the releases this `botmaker` was built with. |

### plugin validate

```
botmaker plugin validate [--no-build] [--coordinate=<G:A:V>] [<dir>]
```

Run the checks the catalog runs on a plugin. A local pass is not a promise the pull request passes: two checks ask
whether an id is already claimed, which only the catalog can answer.

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
pass. The options are those of `bot publish`, except that `--repo` must agree with the folder's origin. See
[Make and publish a plugin](/docs/how-to/make-a-plugin/).

### plugin unpublish

```
botmaker plugin unpublish --id=<plugin-id> [--release=<tag>]
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

Serve Studio's MCP tools over stdio, across Studio's restarts, for an assistant such as Claude Code. In the MCP
client's configuration: `{"type":"stdio","command":"botmaker","args":["mcp-bridge"]}`. It forwards to the Studio
running on this computer, and its `start_studio` tool starts Studio the way `--studio` or `--umbrella` says.

### release

Cut or preview a release of BotMaker itself, across its modules. It is for BotMaker's maintainers, and previews
unless `--execute` is passed.
