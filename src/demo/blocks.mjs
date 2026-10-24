// The demo's blocks. Each label is what Studio's palette shows and each Java line is what Studio writes for it,
// read on 2026-10-24 from:
//
//   core (Studio itself) — botmaker-studio/src/main/java/com/botmaker/studio/palette/BlockCatalog.java:
//     PRINT "Print" (System.out.println, StatementFactory), WHILE "While Loop", FOR_CLASSIC "Counting Loop";
//     categories from BlockCategory (Output, Loops). A blank project's class and main are StarterSources'.
//   basics — botmaker-plugin-basics/.../values/BasicsTypes.java: Basics brings no blocks of its own, only value
//     types and their editors. DURATION is written Duration.ofMillis(n) and TIME LocalTime.of(h, m, s); with it
//     on, the variable blocks (BlockCatalog.declareBlock, labelled by the type) offer those types.
//   sdk — botmaker-sdk/src/main/java/com/botmaker/sdk/api: @Palette classes screens/Navigate (to(Screen)),
//     vision/ImageClicker (click(ImageTemplate)) and time/Wait (seconds(double), its @PaletteDefault); not
//     console/Debug, which has not been offered since 2026-09-30, so the sample loop prints with Studio's own
//     Print. Studio's menu labels them Class.method (StatementMenu.facadeCall). A bot's
//     pictures and screens are constants of its own Pictures and Screens classes in <package>.plugins.sdk, as
//     the SDK's sample bot has them (src/test/resources/samplebot).
//
// Nothing here is invented: a block Studio does not have, or a call the SDK's api does not compile, is a bug.

/** The package and class of a blank project called MyProgram (StarterSources). */
export const PACKAGE = 'com.myprogram';
export const CLASS = 'MyProgram';

const SDK = 'com.botmaker.sdk.api';
const OWN = `${PACKAGE}.plugins.sdk`;

/** A loop forever is three turns in the demo; nothing here runs for real. */
export const FOREVER_TURNS = 3;

/** The plugins, in the order the demo offers them. */
export const PLUGINS = [
  { id: 'core', name: 'Studio', group: 'Studio' },
  { id: 'basics', name: 'Basics plugin', group: 'Basics · values' },
  { id: 'sdk', name: 'SDK plugin', group: 'SDK · game automation' },
];

const named = (base, n) => (n > 1 ? `${base}${n}` : base);
const millis = { '2 s': 2000, '5 min': 300000 };
const clock = { '07:30': '7, 30, 0', '00:00': '0, 0, 0' };

/**
 * @typedef {object} Block
 * @property {string} id
 * @property {'core' | 'basics' | 'sdk'} plugin
 * @property {string} label    what the palette shows
 * @property {string} category Studio's category, for the colour
 * @property {string[]} values the choices of the block's one value, the first the fresh one
 * @property {(value: string, n: number) => string} java the line; n counts this block's earlier uses, for a name
 * @property {string[]} [imports]
 * @property {boolean} [container]
 * @property {(value: string) => number} [turns] how many turns a loop runs in the demo
 * @property {(value: string) => string} [run] the console's line for one step
 * @property {'screen' | 'click'} [game] what the fake game panel shows for it
 */

/** @type {Record<string, Block>} */
export const BLOCKS = {
  print: {
    id: 'print', plugin: 'core', label: 'Print', category: 'output',
    values: ['"Hello!"', '"Done"', '"collected"'],
    java: (v) => `System.out.println(${v});`,
    run: (v) => v.slice(1, -1),
  },
  counting: {
    id: 'counting', plugin: 'core', label: 'Counting Loop', category: 'loops', container: true,
    values: ['3', '5'],
    java: (v) => `for (int i = 0; i < ${v}; i++) {`,
    turns: (v) => Number(v),
  },
  while: {
    id: 'while', plugin: 'core', label: 'While Loop', category: 'loops', container: true,
    values: ['true'],
    java: () => 'while (true) {',
    turns: () => FOREVER_TURNS,
  },
  duration: {
    id: 'duration', plugin: 'basics', label: 'Duration', category: 'variable',
    values: ['2 s', '5 min'],
    java: (v, n) => `Duration ${named('pause', n)} = Duration.ofMillis(${millis[v]});`,
    imports: ['java.time.Duration'],
    run: (v) => `pause = ${v}`,
  },
  time: {
    id: 'time', plugin: 'basics', label: 'Time', category: 'variable',
    values: ['07:30', '00:00'],
    java: (v, n) => `LocalTime ${named('start', n)} = LocalTime.of(${clock[v]});`,
    imports: ['java.time.LocalTime'],
    run: (v) => `start = ${v}`,
  },
  navigate: {
    id: 'navigate', plugin: 'sdk', label: 'Navigate.to', category: 'game',
    values: ['HOME', 'SHOP'],
    java: (v) => `Navigate.to(Screens.${v});`,
    imports: [`${SDK}.screens.Navigate`, `${OWN}.Screens`],
    run: (v) => `on ${v}`,
    game: 'screen',
  },
  click: {
    id: 'click', plugin: 'sdk', label: 'ImageClicker.click', category: 'game',
    values: ['COLLECT', 'BATTLE'],
    java: (v) => `ImageClicker.click(Pictures.${v});`,
    imports: [`${SDK}.vision.ImageClicker`, `${OWN}.Pictures`],
    run: (v) => `found ${v}, clicked`,
    game: 'click',
  },
  wait: {
    id: 'wait', plugin: 'sdk', label: 'Wait.seconds', category: 'game',
    values: ['2', '0.5'],
    java: (v) => `Wait.seconds(${v});`,
    imports: [`${SDK}.time.Wait`],
    run: (v) => `waited ${v} s`,
  },
};
