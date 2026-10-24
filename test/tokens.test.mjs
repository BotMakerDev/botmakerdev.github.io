// The dark look is written twice in tokens.css — once for the system setting (inside the media query) and
// once for the toggle ([data-theme='dark']) — because CSS cannot share a declaration block between the two.
// This keeps the copies equal, so system-dark and toggle-dark never drift apart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

function declarations(afterSelector) {
  const start = css.indexOf(afterSelector);
  assert.ok(start >= 0, `no ${afterSelector} in tokens.css`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return css
    .slice(open + 1, close)
    .split(';')
    .map((d) => d.replace(/\/\*.*?\*\//gs, '').trim())
    .filter(Boolean)
    .sort();
}

test('system-dark and toggle-dark declare the same tokens', () => {
  assert.deepEqual(declarations(":root:not([data-theme='light'])"), declarations(":root[data-theme='dark']"));
});
