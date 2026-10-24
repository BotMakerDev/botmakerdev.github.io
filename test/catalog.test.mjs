import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readCatalog, loadCatalog } from '../src/lib/catalog.mjs';

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
