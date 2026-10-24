// Checks the built site, not the sources: run after `npm run build`. Skipped when dist/ is absent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const built = existsSync(dist);

// Each is a project's own Pages site on this origin, with its dnf/apt repository: installed on people's
// machines. Anything this site emits there would shadow it.
const RESERVED = ['botmaker-studio', 'botmaker-cli', 'botmaker-dashboard', 'botmaker-remote-server'];

test('no page is emitted under a project site path', { skip: !built && 'dist/ not built' }, () => {
  for (const name of RESERVED) {
    assert.ok(!existsSync(dist + name), `dist/${name} would shadow that project's own site`);
  }
});

test('the stylesheet and script the project pages link are served', { skip: !built && 'dist/ not built' }, () => {
  assert.ok(existsSync(dist + 'assets/style.css'), 'dist/assets/style.css');
  assert.ok(existsSync(dist + 'assets/copy.js'), 'dist/assets/copy.js');
});
