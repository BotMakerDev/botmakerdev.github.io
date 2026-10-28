import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  dnfSnippet, aptSnippet, download, appImageSnippet, downloadSnippet, allInOne, assertOneSigningKey, withCode,
  requiredTools, installerSnippet, aurSnippet,
} from '../src/lib/tools.mjs';
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

test('the apt snippet adds the key and the repository, then installs', () => {
  assert.equal(
    aptSnippet({ pages, repo: 'botmaker-studio', package: 'botmaker-studio' }),
    'sudo install -d -m 755 /etc/apt/keyrings\n'
      + 'sudo curl -fsSL -o /etc/apt/keyrings/botmaker.asc https://botmakerdev.github.io/botmaker-studio/botmaker.asc\n'
      + 'echo "deb [signed-by=/etc/apt/keyrings/botmaker.asc] https://botmakerdev.github.io/botmaker-studio/deb stable main"'
      + ' | sudo tee /etc/apt/sources.list.d/botmaker-studio.list\n'
      + 'sudo apt-get update && sudo apt-get install botmaker-studio',
  );
});

test('a tool\'s snippets add the repositories of the tools it requires', () => {
  const studio = tools.find((t) => t.repo === 'botmaker-studio');
  const needs = requiredTools(studio, tools);
  assert.deepEqual(needs.map((t) => t.package), ['botmaker']);
  assert.equal(
    dnfSnippet({ pages, ...studio }, needs),
    'sudo curl -fsSL -o /etc/yum.repos.d/botmaker-studio.repo https://botmakerdev.github.io/botmaker-studio/botmaker-studio.repo\n'
      + 'sudo curl -fsSL -o /etc/yum.repos.d/botmaker.repo https://botmakerdev.github.io/botmaker-cli/botmaker.repo\n'
      + 'sudo dnf install botmaker-studio',
  );
  const apt = aptSnippet({ pages, ...studio }, needs).split('\n');
  assert.equal(apt.filter((line) => line.includes('/etc/apt/keyrings/botmaker.asc https')).length, 1);
  assert.match(apt[3], /botmaker-cli\/deb stable main" \| sudo tee \/etc\/apt\/sources\.list\.d\/botmaker\.list$/);
  assert.equal(apt.at(-1), 'sudo apt-get update && sudo apt-get install botmaker-studio');
});

test('a requirement must be a packaged tool', () => {
  assert.deepEqual(requiredTools({ repo: 'botmaker-cli' }, tools), []);
  assert.throws(() => requiredTools({ repo: 'x', requires: ['botmaker-pilot'] }, tools), /x requires botmaker-pilot, which tools.json lists with no package/);
  assert.throws(() => requiredTools({ repo: 'x', requires: ['nope'] }, tools), /x requires nope/);
});

test('the installer and AUR snippets', () => {
  assert.equal(installerSnippet({ pages, repo: 'botmaker-studio' }),
    'curl -fsSL https://botmakerdev.github.io/botmaker-studio/install.sh | sudo bash');
  assert.equal(aurSnippet({ aur: 'botmaker-studio-bin' }), 'yay -S botmaker-studio-bin');
  assert.throws(() => aurSnippet({}), /no AUR package/);
});

test('a one-click download is the tagged release file, named from its pattern', () => {
  const studio = { repo: 'botmaker-studio', version: 'v1.6.0', downloads: { windows: 'BotMaker-Studio-{version}-windows-x64.msi' } };
  assert.deepEqual(download(studio, 'windows'), {
    name: 'BotMaker-Studio-v1.6.0-windows-x64.msi',
    url: 'https://github.com/BotMakerDev/botmaker-studio/releases/download/v1.6.0/BotMaker-Studio-v1.6.0-windows-x64.msi',
  });
  assert.throws(() => download(studio, 'macos'), /names no macos download for botmaker-studio/);
  assert.throws(() => download({ ...studio, version: undefined }, 'windows'), /no version read/);
});

test('the AppImage snippet downloads, makes runnable and starts the file', () => {
  assert.equal(
    appImageSnippet({ name: 'A.AppImage', url: 'https://example.org/A.AppImage' }),
    'curl -fLO https://example.org/A.AppImage\nchmod +x A.AppImage\n./A.AppImage',
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
