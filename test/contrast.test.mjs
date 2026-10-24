import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { failures, ratio, tokens } from '../tools/check-contrast.mjs';
import { DARK_EDITOR, MANUAL } from '../src/lib/code-themes.mjs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

test('ratio is WCAG\'s', () => {
  assert.equal(ratio('#000000', '#ffffff'), 21);
  assert.equal(ratio('#777', '#777'), 1);
  assert.ok(ratio('#1d1b17', '#f3eee4') >= 4.5);
});

test('the raw orange is not text on paper: --accent-text is', () => {
  const light = tokens(css, ':root');
  assert.equal(light.accent, '#d4550f');
  assert.ok(ratio(light.accent, light.bg) < 4.5);
  assert.ok(ratio(light['accent-text'], light.bg) >= 4.5);
});

test('every pair the pages draw is AA in both looks', () => {
  assert.deepEqual(failures(css), []);
});

test('the docs\' code blocks use the tokens\' Java colours', () => {
  const looks = [[MANUAL, tokens(css, ':root')], [DARK_EDITOR, tokens(css, ":root[data-theme='dark']")]];
  for (const [theme, t] of looks) {
    const colours = Object.fromEntries(theme.tokenColors.map((c) => [c.scope[0], c.settings.foreground]));
    assert.deepEqual(
      [theme.colors['editor.background'], theme.colors['editor.foreground'], colours.comment, colours.keyword,
        colours['entity.name.function'], colours.string],
      [t['code-bg'], t.fg, t.muted, t.kw, t.fn, t.st],
      theme.name,
    );
  }
});

test('a mixed background is mixed as color-mix does', () => {
  const light = css.replace('--accent-text: #9c3d09;', '--accent-text: #b4460a;');
  assert.notEqual(light, css, 'the light --accent-text in tokens.css changed: update this test');
  // #b4460a on color-mix(#d4550f 16%, #f3eee4) = #eed6c2 is 3.93.
  assert.ok(failures(light).some((line) => line.includes('on --accent 16% bg #eed6c2 is 3.93')));
});

test('a token under AA is reported', () => {
  const bad = css.replace('--muted: #645e54;', '--muted: #b0aa9f;');
  assert.notEqual(bad, css, 'the light --muted in tokens.css changed: update this test');
  assert.ok(failures(bad).some((line) => line.startsWith('light: --muted #b0aa9f on --bg')));
});
