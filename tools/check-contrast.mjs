#!/usr/bin/env node
// Checks every text colour against the background it sits on, in both looks, from src/styles/tokens.css alone:
// WCAG AA, 4.5 for text. Nothing the site draws is large enough for 3 to apply other than headlines, which are
// --fg and already held to 4.5. A background mixed in CSS is written as its color-mix: 'accent 16% bg'.
//
//   node tools/check-contrast.mjs
//
// A failing pair is fixed in the tokens, never by dropping it from PAIRS: the list is what the pages draw.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TOKENS = new URL('../src/styles/tokens.css', import.meta.url);

/** [text, background, minimum, where it is drawn] — each name a token without its `--`. */
export const PAIRS = [
  ['fg', 'bg', 4.5, 'body text'],
  ['fg', 'panel', 4.5, 'text in a card or the demo'],
  ['fg', 'soft', 4.5, 'inline code, the palette'],
  ['muted', 'bg', 4.5, 'ledes, notes, captions'],
  ['muted', 'panel', 4.5, 'a card\'s line, the gallery\'s description'],
  ['muted', 'soft', 4.5, 'the palette\'s group names and hint'],
  ['accent-text', 'bg', 4.5, 'links, eyebrows'],
  ['accent-text', 'panel', 4.5, 'links in a card'],
  ['accent-text', 'soft', 4.5, 'a docs link around inline code'],
  ['accent-text', 'accent 16% bg', 4.5, 'Starlight\'s --sl-color-accent-low: a focused search result'],
  ['on-accent', 'accent-fill', 4.5, 'a primary button, Run, the skip link'],
  ['k-fg', 'k1', 4.5, 'a block of the first kind'],
  ['k-fg', 'k2', 4.5, 'a block of the second kind'],
  ['k-fg', 'k3', 4.5, 'a block of the third kind'],
  ['k-fg', 'k4', 4.5, 'a block of the fourth kind'],
  ['fg', 'code-bg', 4.5, 'Java'],
  ['kw', 'code-bg', 4.5, 'a Java keyword'],
  ['fn', 'code-bg', 4.5, 'a Java call'],
  ['st', 'code-bg', 4.5, 'a Java string'],
  ['fg', 'code-live', 4.5, 'the demo\'s line being run'],
  ['kw', 'code-live', 4.5, 'a keyword on the line being run'],
  ['fn', 'code-live', 4.5, 'a call on the line being run'],
  ['st', 'code-live', 4.5, 'a string on the line being run'],
  ['term-fg', 'term-bg', 4.5, 'a terminal'],
  ['term-prompt', 'term-bg', 4.5, 'a terminal\'s prompt'],
  ['term-muted', 'term-bg', 4.5, 'a terminal\'s comment'],
];

/** The declarations of the first rule whose selector is `selector`, as {name: value}. */
export function tokens(css, selector) {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`no "${selector} {" in tokens.css`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  const out = {};
  for (const [, name, value] of body.replace(/\/\*.*?\*\//gs, '').matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    out[name] = value.trim();
  }
  return out;
}

function channels(hex) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`not a #rgb or #rrggbb colour: ${hex}`);
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

function luminance(hex) {
  const [r, g, b] = channels(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** A token's colour, or 'a N% b' mixed as CSS's color-mix(in srgb, a N%, b) does. */
function colour(t, spec) {
  const mix = /^([\w-]+) (\d+)% ([\w-]+)$/.exec(spec);
  if (!mix) return t[spec];
  const [, a, percent, b] = mix;
  if (!t[a] || !t[b]) return undefined;
  const p = Number(percent) / 100;
  const [ca, cb] = [channels(t[a]), channels(t[b])];
  return '#' + ca.map((v, i) => Math.round((v * p + cb[i] * (1 - p)) * 255).toString(16).padStart(2, '0')).join('');
}

/** WCAG's contrast ratio of two colours, 1 to 21. */
export function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Every pair of PAIRS under `minimum` in either look, as readable lines; empty when all pass. */
export function failures(css) {
  const looks = { light: tokens(css, ':root'), dark: tokens(css, ":root[data-theme='dark']") };
  const out = [];
  for (const [look, t] of Object.entries(looks)) {
    for (const [text, bg, minimum, where] of PAIRS) {
      const back = colour(t, bg);
      if (!t[text] || !back) throw new Error(`${look}: no --${t[text] ? bg : text} in tokens.css`);
      const r = ratio(t[text], back);
      if (r < minimum) {
        out.push(`${look}: --${text} ${t[text]} on --${bg} ${back} is ${r.toFixed(2)}, under ${minimum} (${where})`);
      }
    }
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const bad = failures(readFileSync(TOKENS, 'utf8'));
  for (const line of bad) console.log(`::error::${line}`);
  if (bad.length) process.exit(1);
  console.log(`${PAIRS.length} pairs in both looks, all AA`);
}
