import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dnfSnippet, downloadSnippet, allInOne, assertOneSigningKey, withCode } from '../src/lib/tools.mjs';
import { systemOf } from '../src/lib/system.mjs';

const pages = 'https://botmakerdev.github.io';
const { tools } = JSON.parse(readFileSync(new URL('./fixtures/tools.json', import.meta.url), 'utf8'));

test('the dnf snippet is derived from the repository and the package', () => {
  assert.equal(
    dnfSnippet({ pages, repo: 'botmaker-studio', package: 'botmaker-studio' }),
    'sudo curl -fsSL -o /etc/yum.repos.d/botmaker-studio.repo https://botmakerdev.github.io/botmaker-studio/botmaker-studio.repo\n'
      + 'sudo dnf install botmaker-studio',
  );
});

test('a release asset downloads from the latest release', () => {
  assert.equal(
    downloadSnippet({ repo: 'botmaker-pilot', asset: 'botpilot.apk' }),
    'curl -fLO https://github.com/BotMakerDev/botmaker-pilot/releases/latest/download/botpilot.apk',
  );
});

test('install everything lists only the packaged tools', () => {
  const all = allInOne(tools, { pages });
  assert.deepEqual(all.names, ['botmaker-studio', 'botmaker']);
  assert.equal(all.dnf.split('\n').at(-1), 'sudo dnf install botmaker-studio botmaker');
  assert.match(all.dnf, /botmaker-cli\/botmaker\.repo/);
  assert.doesNotMatch(all.dnf + all.apt, /pilot/);
  assert.match(all.apt, /^sudo install -d -m 755 \/etc\/apt\/keyrings\n/);
  assert.match(all.apt, /deb \[signed-by=\/etc\/apt\/keyrings\/botmaker\.asc\] https:\/\/botmakerdev\.github\.io\/botmaker-cli\/deb stable main/);
  assert.equal(all.apt.split('\n').at(-1), 'sudo apt-get update && sudo apt-get install botmaker-studio botmaker');
});

test('install everything refuses a list with nothing packaged', () => {
  assert.throws(() => allInOne([tools[2]], { pages }), /no packaged tool/);
});

function keys(byRepo) {
  return async (url) => {
    const repo = new URL(url).pathname.split('/')[1];
    if (!(repo in byRepo)) return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
    return { ok: true, status: 200, arrayBuffer: async () => new TextEncoder().encode(byRepo[repo]).buffer };
  };
}

test('one signing key across the repositories passes', async () => {
  await assertOneSigningKey(['a', 'b'], { fetch: keys({ a: 'KEY', b: 'KEY' }), pages });
});

test('two different signing keys fail', async () => {
  await assert.rejects(
    assertOneSigningKey(['a', 'b'], { fetch: keys({ a: 'KEY', b: 'OTHER' }), pages }),
    /b is signed by a different key than a/,
  );
});

test('a repository with no signing key fails', async () => {
  await assert.rejects(
    assertOneSigningKey(['a', 'b'], { fetch: keys({ a: 'KEY' }), pages }),
    /b publishes no signing key/,
  );
});

test('backticks become code, the rest stays text', () => {
  assert.deepEqual(withCode('No install: `jbang botmaker@BotMakerDev`.'), [
    { code: false, text: 'No install: ' },
    { code: true, text: 'jbang botmaker@BotMakerDev' },
    { code: false, text: '.' },
  ]);
  assert.deepEqual(withCode('<b>plain</b>'), [{ code: false, text: '<b>plain</b>' }]);
});

test('the visitor\'s system is guessed from the platform, Linux by default', () => {
  assert.equal(systemOf('Win32'), 'windows');
  assert.equal(systemOf('Windows'), 'windows');
  assert.equal(systemOf('MacIntel'), 'macos');
  assert.equal(systemOf('macOS'), 'macos');
  assert.equal(systemOf('Linux x86_64'), 'linux');
  assert.equal(systemOf(''), 'linux');
  assert.equal(systemOf(undefined), 'linux');
});
