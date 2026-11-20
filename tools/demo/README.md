# Screenshots and the blocks video

The pictures in `public/shots/` and the video in `public/video/` are real Studio, driven by Claude Code through the dev
Studio's `ui` tool. Re-make them after a UI change with these steps. The scripts assume KDE Plasma on Wayland
(`spectacle`, KWin scripting over `qdbus`), ImageMagick 7, ffmpeg and `jq`. `place.js` holds this machine's screen
layout in logical pixels (a 1920x1080 screen at x=1423, the window at 1543,20 sized 1680x1000). `rec.sh`'s crop is in
the full grab's physical pixels, here twice the logical ones: for a window at x,y of size w×h with a title bar t
high (28 here), it is `2w x 2(h−t) + 2x + 2(y+t)`, x counted from the desktop's left edge.
Change both for another layout, and check one frame before recording the rest.

## Before

- Start the dev Studio in a sandbox, never on your own projects: `start_studio` with `home` a fresh folder and
  `ui: true`. The window title shows the sandbox path, which is why every capture leaves the title bar out.
- Turn on *Do not disturb*: a notification over the window lands in the picture.
- Look at every picture before it goes in. Nothing personal may show: no e-mail, no account, no home path.

## Screenshots

`shot.sh <out.png> [title-prefix] [WxH|keep]` raises the window whose title starts with the prefix, sizes it (1600x960
unless given; `keep` leaves its size alone) and captures it with no decoration and no shadow. Take each shot twice, once per theme (*View ▸ Theme
▸ Default* and *Dark*), at the same size, then convert:

```bash
magick shot.png -resize '1600x>' -quality 82 public/shots/<name>-light.webp
```

| Shot | Where | Size |
|---|---|---|
| `home` | the bot list | default |
| `program` | a blank project after a counting loop and a run | default |
| `bot-pictures` | a game bot's `Pictures.java` | default |
| `versions` | *Versions*, one version selected | default |
| `assistant` | *Assistant*, calls filtered to `edit_code`, a call selected | default |
| `params` | *Parameters* | 1000x720 |
| `plugins` | *Plugins & Libraries* | 900x560 |

In the Assistant, filter the calls before selecting one: a `ui` call's reply names the sandbox path.

## The video

`rec.sh <name>` places Studio's main window, grabs the whole screen (popups included) and crops it to the window
below its title bar, into `frames/<name>.png` (ignored by git: empty `frames/` before a new take, since
`video.sh` uses every PNG there). The frames, in order (no `08`: the frames taken while the run was going added
nothing):

1. `01-home`: the bot list.
2. `02-new`: *＋ New bot*, the name `HelloLoop` typed, *Blank* picked.
3. `03-blank`: after *Create*: `main` with one Print.
4. `04-loop`: a Counting Loop inserted above the Print (`edit_code` insert `block:FOR_CLASSIC`).
5. `05-print`: a Print inserted in the loop's body (`block:PRINT`).
6. `06-text`: `Hello, world!` typed in the new Print.
7. `07-edited`: the loop's `10` changed to `3`, the last Print to `Done!`.
8. `09-done`: *▶ Run ▸ Run*, three `Hello, world!` and `Done!` in the console.

A number field commits when it loses focus: activate Studio's window first (`rec.sh` does), press the field, type,
then press another field. Then `video.sh` builds `out/blocks-demo.webm`, `.mp4` and the poster (each frame held 3 s,
0.5 s fades, 1280x740); copy them to `public/video/`.
