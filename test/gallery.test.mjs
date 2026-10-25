import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readCatalog } from '../src/lib/catalog.mjs';
import { downloadLabel, filterRows, letterOf, mergeLive, renderRow, toRows } from '../src/scripts/gallery.mjs';

const v4 = () => JSON.parse(readFileSync(new URL('./fixtures/catalog-v4.json', import.meta.url), 'utf8'));

const farmBot = {
  repo: 'someone/farm-bot', rank: 'community', stars: 3, forkOf: 'BotMakerDev/farm-bot',
  description: 'Waters the crops every morning.',
  releases: [{ tag: 'v1.2.0', commit: 'abc1234', plugins: [{ id: 'com.botmaker.sdk' }] }],
};

function withBot(json = v4()) {
  json.bots.push(farmBot);
  return json;
}

// Just enough of a document for renderRow: elements with children, attributes and text. Setting textContent
// stores text; nothing here parses markup, so an element appears only if renderRow creates it.
function stubDocument() {
  const element = (tag) => ({
    tagName: tag.toUpperCase(),
    children: [],
    attributes: {},
    className: '',
    text: '',
    set textContent(value) { this.text = String(value); this.children = []; },
    get textContent() { return this.text + this.children.map((c) => c.textContent).join(''); },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    append(...nodes) {
      for (const node of nodes) this.children.push(typeof node === 'string' ? { textContent: node, children: [] } : node);
    },
  });
  return { createElement: element };
}

const all = (el) => [el, ...(el.children ?? []).flatMap(all)];

test('rows: bots first, then plugins, each with its kind, rank and newest tag', () => {
  const rows = toRows(readCatalog(withBot()), new Set(['com.botmaker.sdk']));
  assert.deepEqual(rows.map((row) => row.kind), ['bot', 'plugin', 'plugin']);
  const [bot, , sdk] = rows;
  assert.equal(bot.tag, 'v1.2.0');
  assert.equal(bot.forkOf, 'BotMakerDev/farm-bot');
  assert.equal(sdk.tag, 'v1.5.0');
  assert.equal(sdk.page, '/plugins/com.botmaker.sdk/');
  assert.equal(rows[1].page, undefined);
});

test('filterRows by kind', () => {
  const rows = toRows(readCatalog(withBot()));
  assert.equal(filterRows(rows, { kind: 'all' }).length, 3);
  assert.deepEqual(filterRows(rows, { kind: 'bots' }).map((row) => row.repo), ['someone/farm-bot']);
  assert.equal(filterRows(rows, { kind: 'plugins' }).length, 2);
});

test('filterRows by a query matching the repository, the name or the description, any case', () => {
  const rows = toRows(readCatalog(withBot()));
  assert.deepEqual(filterRows(rows, { query: 'FARM' }).map((row) => row.repo), ['someone/farm-bot']);
  assert.deepEqual(filterRows(rows, { query: '  crops ' }).map((row) => row.repo), ['someone/farm-bot']);
  assert.deepEqual(filterRows(rows, { query: 'durations', kind: 'plugins' }).map((row) => row.name), ['BotMaker Basics Plugin']);
  assert.deepEqual(filterRows(rows, { query: 'crops', kind: 'plugins' }), []);
  assert.equal(filterRows(rows, { query: '' }).length, 3);
});

test('failed re-read keeps the built list', () => {
  const built = toRows(readCatalog(v4()), new Set(['com.botmaker.sdk']));
  assert.equal(mergeLive(built, new Error('offline')), built);
  assert.equal(mergeLive(built, { ok: false, reason: 'schema 3' }), built);
  assert.equal(mergeLive(built, undefined), built);
});

test('a live result adds a newly listed bot, and keeps the pages the build made', () => {
  const built = toRows(readCatalog(v4()), new Set(['com.botmaker.sdk']));
  const rows = mergeLive(built, readCatalog(withBot()));
  assert.deepEqual(rows.map((row) => row.repo), ['someone/farm-bot', ...built.map((row) => row.repo)]);
  assert.equal(rows.find((row) => row.id === 'com.botmaker.sdk').page, '/plugins/com.botmaker.sdk/');
});

test('a plugin listed after the build links its repository, not a page that does not exist', () => {
  const built = toRows(readCatalog(v4()), new Set(['com.botmaker.sdk']));
  const json = v4();
  json.plugins.push({ ...json.plugins[1], id: 'org.weather', repo: 'someone/weather' });
  const added = mergeLive(built, readCatalog(json)).find((row) => row.id === 'org.weather');
  assert.equal(added.page, undefined);
  const links = all(renderRow(stubDocument(), added)).filter((el) => el.tagName === 'A');
  assert.deepEqual(links.map((a) => a.attributes.href), ['https://github.com/someone/weather']);
});

test('description is text', () => {
  const json = withBot();
  json.bots[0] = { ...farmBot, description: '<img src=x onerror=alert(1)>' };
  const [row] = toRows(readCatalog(json));
  const el = renderRow(stubDocument(), row);
  // The bot's own icon is the one picture the row draws.
  assert.ok(row.icon);
  assert.ok(!all(el).some((node) => node.tagName === 'IMG' && node.attributes.src !== row.icon));
  assert.ok(el.textContent.includes('<img src=x onerror=alert(1)>'));
});

test('a row shows the rank, the newest tag, the fork it is based on, the stars and the repository', () => {
  const [row] = toRows(readCatalog(withBot()));
  const el = renderRow(stubDocument(), row);
  for (const text of ['Community', 'v1.2.0', 'based on', 'BotMakerDev/farm-bot', '3']) {
    assert.ok(el.textContent.includes(text), text);
  }
  const hrefs = all(el).filter((node) => node.tagName === 'A').map((a) => a.attributes.href);
  assert.ok(hrefs.includes('https://github.com/someone/farm-bot'));
  assert.ok(hrefs.includes('https://github.com/BotMakerDev/farm-bot'));
});

const SHA = 'b'.repeat(64);
const bmkBot = { ...farmBot, releases: [{ tag: 'v1.2.0', commit: 'abc1234', plugins: [], bmkSha256: SHA }] };

test('a bot row with a .bmk shows Download and the line to install BotMaker; its icon lies over its letter', () => {
  const json = v4();
  json.bots.push(bmkBot);
  const catalog = readCatalog(json);
  catalog.bots[0] = { ...catalog.bots[0], download: 'https://github.com/someone/farm-bot/releases/download/v1.2.0/farm-1.2.0.bmk' };
  const [row] = toRows(catalog);
  const el = renderRow(stubDocument(), row);
  const nodes = all(el);
  const hrefs = nodes.filter((node) => node.tagName === 'A').map((a) => a.attributes.href);
  assert.ok(hrefs.includes(row.download));
  assert.ok(hrefs.includes('/install/'));
  assert.ok(el.textContent.includes('Opens in BotMaker'));
  const img = nodes.find((node) => node.tagName === 'IMG');
  assert.equal(img.attributes.src, 'https://raw.githubusercontent.com/someone/farm-bot/abc1234/icon.png');
  assert.equal(img.attributes.alt, '');
  assert.ok(nodes.find((node) => node.className === 'gicon').textContent.startsWith('F'));
});

test('a bot whose release is gone says so and links nothing; one with no .bmk shows neither', () => {
  const json = v4();
  json.bots.push(bmkBot, { ...farmBot, repo: 'someone/plain-bot' });
  const catalog = readCatalog(json);
  catalog.bots[0] = { ...catalog.bots[0], gone: true };
  const [gone, plain] = toRows(catalog);
  const goneEl = renderRow(stubDocument(), gone);
  assert.ok(goneEl.textContent.includes('This release is no longer available.'));
  assert.ok(!all(goneEl).some((node) => node.tagName === 'A' && node.textContent === 'Download'));
  const plainEl = renderRow(stubDocument(), plain);
  assert.ok(!plainEl.textContent.includes('Download'));
  assert.ok(!plainEl.textContent.includes('no longer available'));
});

test('the re-read keeps a Download only for the release the build looked up', () => {
  const json = v4();
  json.bots.push(bmkBot);
  const catalog = readCatalog(json);
  const url = 'https://github.com/someone/farm-bot/releases/download/v1.2.0/farm-1.2.0.bmk';
  catalog.bots[0] = { ...catalog.bots[0], download: url };
  const built = toRows(catalog);
  assert.equal(mergeLive(built, readCatalog(json))[0].download, url);
  const newer = v4();
  newer.bots.push({ ...bmkBot, releases: [{ tag: 'v1.3.0', commit: 'def5678', plugins: [], bmkSha256: SHA }] });
  assert.equal(mergeLive(built, readCatalog(newer))[0].download, undefined);
  const repinned = v4();
  repinned.bots.push({ ...bmkBot, releases: [{ ...bmkBot.releases[0], bmkSha256: 'c'.repeat(64) }] });
  assert.equal(mergeLive(built, readCatalog(repinned))[0].download, undefined);
});

test('Download names the file\'s release when the newest one has no .bmk', () => {
  const json = v4();
  json.bots.push({ ...farmBot, releases: [{ tag: 'v1.3.0', commit: 'def5678', plugins: [] }, ...bmkBot.releases] });
  const [row] = toRows(readCatalog(json));
  assert.equal(downloadLabel(row), 'Download v1.2.0');
  assert.equal(downloadLabel({ ...row, bmkTag: 'v1.3.0' }), 'Download');
});

test('the re-read keeps what the build found of the icon at the same tag, and shows a newer one unchecked', () => {
  const json = withBot();
  const catalog = readCatalog(json);
  const { icon, ...noIcon } = catalog.bots[0];
  const built = toRows({ ...catalog, bots: [noIcon] });
  assert.equal(mergeLive(built, readCatalog(json))[0].icon, undefined);
  const newer = v4();
  newer.bots.push({ ...farmBot, releases: [{ tag: 'v1.3.0', commit: 'def5678', plugins: [] }] });
  assert.equal(mergeLive(built, readCatalog(newer))[0].icon,
    'https://raw.githubusercontent.com/someone/farm-bot/def5678/icon.png');
});

test('letterOf takes the first letter or digit', () => {
  assert.equal(letterOf('farm-bot'), 'F');
  assert.equal(letterOf('-9lives'), '9');
  assert.equal(letterOf('---'), '?');
});
