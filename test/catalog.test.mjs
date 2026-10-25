import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bmkDownload, readCatalog, loadCatalog, withFiles } from '../src/lib/catalog.mjs';

const fixture = (name) => new URL(`./fixtures/${name}`, import.meta.url);
const v4 = () => JSON.parse(readFileSync(fixture('catalog-v4.json'), 'utf8'));

function respond(status, body) {
  return async () => ({ ok: status >= 200 && status < 300, status, text: async () => body });
}

test('schema 4 reads', () => {
  const catalog = readCatalog(v4());
  assert.equal(catalog.ok, true);
  const sdk = catalog.plugins.find((p) => p.id === 'com.botmaker.sdk');
  assert.equal(sdk.rank, 'admin');
  assert.equal(sdk.newest.tag, sdk.releases[0].tag);
  assert.equal(sdk.newest.tag, 'v1.5.0');
  assert.equal(sdk.releases.length, 2);
  assert.deepEqual(catalog.bots, []);
});

test('schema 3 is unreadable', () => {
  const catalog = readCatalog(JSON.parse(readFileSync(fixture('catalog-v3.json'), 'utf8')));
  assert.equal(catalog.ok, false);
  assert.match(catalog.reason, /schema 3/);
});

test('a row without releases is left out, the others kept', () => {
  const json = v4();
  delete json.plugins[0].releases;
  json.plugins.push({ ...json.plugins[1], id: 'x.empty', releases: [] });
  const catalog = readCatalog(json);
  assert.deepEqual(catalog.plugins.map((p) => p.id), ['com.botmaker.sdk']);
});

test('an unknown rank is left out, the others kept', () => {
  const json = v4();
  json.plugins[0].rank = 'gold';
  assert.deepEqual(readCatalog(json).plugins.map((p) => p.id), ['com.botmaker.sdk']);
});

test('a repository that is not owner/name is left out', () => {
  const json = v4();
  json.plugins[0].repo = 'javascript:alert(1)';
  assert.deepEqual(readCatalog(json).plugins.map((p) => p.id), ['com.botmaker.sdk']);
  json.plugins[0].repo = 'BotMakerDev/..';
  assert.deepEqual(readCatalog(json).plugins.map((p) => p.id), ['com.botmaker.sdk']);
});

test('a plugin id that cannot name a page is left out', () => {
  for (const id of ['../../etc', 'a/b', '..', 'with space']) {
    const json = v4();
    json.plugins[0].id = id;
    assert.deepEqual(readCatalog(json).plugins.map((p) => p.id), ['com.botmaker.sdk'], id);
  }
});

test('a description is kept as the text it is', () => {
  const json = v4();
  json.plugins[0].description = '<script>alert(1)</script>';
  assert.equal(readCatalog(json).plugins[0].description, '<script>alert(1)</script>');
});

test('a bot reads, with the repository it was forked from', () => {
  const json = v4();
  json.bots.push({
    repo: 'someone/farm-bot', rank: 'community', stars: 2, forkOf: 'BotMakerDev/farm-bot',
    releases: [{ tag: 'v1.0.0', commit: 'abc', plugins: [{ id: 'com.botmaker.sdk', version: 'v1.5.0' }] }],
  });
  const [bot] = readCatalog(json).bots;
  assert.equal(bot.forkOf, 'BotMakerDev/farm-bot');
  assert.equal(bot.newest.tag, 'v1.0.0');
  assert.equal(bot.description, '');
});

test('non-JSON / null is unreadable', () => {
  assert.equal(readCatalog(null).ok, false);
  assert.equal(readCatalog('not json').ok, false);
  assert.equal(readCatalog([]).ok, false);
});

test('a catalog that answers with something unreadable is not an error', async () => {
  const catalog = await loadCatalog({ fetch: respond(200, '<html>'), file: undefined });
  assert.equal(catalog.ok, false);
});

test('a catalog that does not answer fails the build', async () => {
  await assert.rejects(loadCatalog({ fetch: respond(404, ''), file: undefined }), /HTTP 404/);
  await assert.rejects(
    loadCatalog({ fetch: async () => { throw new TypeError('fetch failed'); }, file: undefined }),
    /fetch failed/,
  );
});

test('CATALOG_FILE reads a local file and fetches nothing', async () => {
  const catalog = await loadCatalog({
    fetch: async () => assert.fail('fetched'),
    file: fileURLToPath(fixture('catalog-v4.json')),
  });
  assert.equal(catalog.ok, true);
});

const SHA = 'a'.repeat(64);
const firestone = (releases) => ({ repo: 'someone/firestone-bot', rank: 'community', stars: 0, releases });

test('a bot offers the .bmk of its newest release that has one, and its icon at the newest commit', () => {
  const json = v4();
  json.bots.push(firestone([
    { tag: 'v1.1.0', commit: 'bbbbbbb', plugins: [] },
    { tag: 'v1.0.0', commit: 'aaaaaaa', plugins: [], bmkSha256: SHA },
  ]));
  const [bot] = readCatalog(json).bots;
  assert.deepEqual(bot.bmk, { tag: 'v1.0.0', sha256: SHA });
  assert.equal(bot.icon, 'https://raw.githubusercontent.com/someone/firestone-bot/bbbbbbb/icon.png');
  assert.equal(bot.releases[1].bmkSha256, SHA);
});

test('a bot with no .bmk, a pin that is not a sha256, or a commit that is not hex offers neither', () => {
  const json = v4();
  json.bots.push(firestone([{ tag: 'v1.0.0', commit: '../../x', plugins: [], bmkSha256: 'not-a-sha' }]));
  const [bot] = readCatalog(json).bots;
  assert.equal(bot.bmk, undefined);
  assert.equal(bot.icon, undefined);
  assert.equal(bot.releases[0].bmkSha256, undefined);
});

const assets = (...hrefs) => hrefs.map((href) => `<a href="${href}" rel="nofollow">x</a>`).join('\n');

test('the .bmk download is read off the release page, named after the bot', async () => {
  const seen = [];
  const fetch = async (url) => {
    seen.push(url);
    return { ok: true, status: 200, text: async () => assets(
      '/someone/firestone-bot/releases/download/v1.0.0/notes.txt',
      '/someone/firestone-bot/releases/download/v1.0.0/gamebot-1.0.0.bmk',
      '/elsewhere/x/releases/download/v1.0.0/evil-1.0.0.bmk',
    ) };
  };
  assert.deepEqual(await bmkDownload('someone/firestone-bot', 'v1.0.0', { fetch }),
    { url: 'https://github.com/someone/firestone-bot/releases/download/v1.0.0/gamebot-1.0.0.bmk' });
  assert.deepEqual(await bmkDownload('Someone/Firestone-Bot', 'v1.0.0', { fetch }),
    { url: 'https://github.com/someone/firestone-bot/releases/download/v1.0.0/gamebot-1.0.0.bmk' });
  assert.equal(seen[0], 'https://github.com/someone/firestone-bot/releases/expanded_assets/v1.0.0');
});

test('a release that is gone, or lists no .bmk, is no longer available', async () => {
  assert.deepEqual(await bmkDownload('someone/firestone-bot', 'v1.0.0', { fetch: respond(404, '') }), { gone: true });
  assert.deepEqual(await bmkDownload('someone/firestone-bot', 'v1.0.0', { fetch: respond(200, assets('/a/b')) }),
    { gone: true });
});

test('a release page that fails otherwise fails the build', async () => {
  await assert.rejects(bmkDownload('someone/firestone-bot', 'v1.0.0', { fetch: respond(500, '') }), /HTTP 500/);
});

test('withFiles looks up the .bmk of the bots that pin one, and keeps an icon only when it is there', async () => {
  const json = v4();
  json.bots.push(firestone([{ tag: 'v1.0.0', commit: 'aaaaaaa', plugins: [], bmkSha256: SHA }]));
  json.bots.push({ ...firestone([{ tag: 'v2.0.0', commit: 'ccccccc', plugins: [] }]), repo: 'someone/plain-bot' });
  json.bots.push({ ...firestone([{ tag: 'v3.0.0', commit: 'ddddddd', plugins: [], bmkSha256: SHA }]), repo: 'someone/gone-bot' });
  const fetch = async (url) => {
    assert.ok(!(url.includes('plain-bot') && url.includes('expanded_assets')), url);
    if (url.includes('gone-bot')) return { ok: false, status: 404, text: async () => '' };
    return { ok: true, status: 200, text: async () => assets('/someone/firestone-bot/releases/download/v1.0.0/fire-1.0.0.bmk') };
  };
  const { bots } = await withFiles(readCatalog(json), { fetch });
  assert.equal(bots[0].download, 'https://github.com/someone/firestone-bot/releases/download/v1.0.0/fire-1.0.0.bmk');
  assert.equal(bots[0].icon, 'https://raw.githubusercontent.com/someone/firestone-bot/aaaaaaa/icon.png');
  assert.equal(bots[1].download, undefined);
  assert.equal(bots[1].gone, undefined);
  assert.equal(bots[2].gone, true);
  assert.equal(bots[2].icon, undefined);
});

test('an icon that fails otherwise than 404 fails the build', async () => {
  const json = v4();
  json.bots.push(firestone([{ tag: 'v1.0.0', commit: 'aaaaaaa', plugins: [] }]));
  await assert.rejects(withFiles(readCatalog(json), { fetch: respond(503, '') }), /HTTP 503/);
});
