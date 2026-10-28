// The gallery: every bot and plugin in the catalog as rows, a search and a kind filter over them, and a re-read of
// the catalog in the browser so a listing merged since the last build shows. The pure functions are tested by
// test/gallery.test.mjs; mount wires them to the markup gallery.astro renders.
//
// Every text lands through textContent (or a text node), never as HTML: a description is whatever its author
// wrote. A re-read that fails, for any reason, changes nothing on the page.

import { CATALOG_URL, RANK_LABEL, readCatalog } from '../lib/catalog-read.mjs';

/**
 * A row's `icon` is its icon.png's address, shown over its `letter`; a plugin's `page` is the one the build made for
 * its repository. A bot's `bmkTag` is the release whose `.bmk` the build looked up, `download` where it is and
 * `gone` when it no longer is.
 *
 * @typedef {{kind: 'bot' | 'plugin', repo: string, name: string, description: string,
 *   rank: string, tag: string, stars: number, letter: string, forkOf?: string, page?: string, icon?: string,
 *   bmkTag?: string, bmkSha256?: string, download?: string, gone?: true}} Row
 */

/** The Download link's text: it names the file's release when that is not the newest one the row shows. */
export const downloadLabel = (row) => (row.bmkTag && row.bmkTag !== row.tag
  ? `Download .bmk (${row.bmkTag})` : 'Download .bmk');

/**
 * The link Open in Studio follows: an installed Studio registers `botmaker://` and gets the catalog's file itself,
 * so nothing lands in the reader's downloads (2026-10-25, the user's call).
 */
export const openLink = (repo) => `botmaker://run/${repo}`;

/** A plugin's page, named by its repository like everything else about it. */
export const pagePath = (repo) => `/plugins/${repo}/`;
const repoUrl = (repo) => `https://github.com/${repo}`;

/** The install page, which the Open line sends to: a link or a `.bmk` opens only where BotMaker is installed. */
export const INSTALL = '/install/';
export const GONE = 'This release is no longer available.';

/** How long a click on Open in Studio waits for the page to lose focus before it says Studio did not open. */
export const OPEN_WAIT_MS = 1500;

/**
 * Calls `onMissed` when a `botmaker://` link seems to have opened nothing. A page cannot ask whether an app took the
 * link; an app that did takes the focus (and a browser that asks first takes it too), while a scheme no app
 * registered leaves the page as it was. So no `blur`, and still visible after `ms`, is a miss.
 *
 * @param {Pick<Window, 'addEventListener' | 'removeEventListener' | 'setTimeout'>} win
 * @param {Pick<Document, 'addEventListener' | 'removeEventListener' | 'visibilityState'>} doc
 * @param {() => void} onMissed
 */
export function watchOpen(win, doc, onMissed, ms = OPEN_WAIT_MS) {
  let left = false;
  const leave = () => { left = true; };
  const hidden = () => { if (doc.visibilityState !== 'visible') left = true; };
  win.addEventListener('blur', leave);
  doc.addEventListener('visibilitychange', hidden);
  win.setTimeout(() => {
    win.removeEventListener('blur', leave);
    doc.removeEventListener('visibilitychange', hidden);
    if (!left && doc.visibilityState === 'visible') onMissed();
  }, ms);
}

/** The square an entry without an icon shows: its name's first letter or digit. */
export const letterOf = (name) => (/[A-Za-z0-9]/.exec(name)?.[0] ?? '?').toUpperCase();

function botRow(bot) {
  return {
    kind: 'bot', name: bot.repo.split('/')[1],
    ...(bot.forkOf ? { forkOf: bot.forkOf } : {}),
    ...(bot.bmk ? { bmkTag: bot.bmk.tag, bmkSha256: bot.bmk.sha256 } : {}),
    ...(bot.download ? { download: bot.download } : {}),
    ...(bot.gone ? { gone: true } : {}),
  };
}

/**
 * A read catalog as rows: bots first, then plugins, each in the catalog's order.
 *
 * @param {ReturnType<typeof readCatalog>} catalog
 * @param {Set<string>} pages the plugin repositories the build made a page for
 * @returns {Row[]}
 */
export function toRows(catalog, pages = new Set()) {
  if (!catalog?.ok) return [];
  const common = (entry) => ({
    repo: entry.repo, description: entry.description, rank: entry.rank, tag: entry.newest.tag, stars: entry.stars,
    ...(entry.icon ? { icon: entry.icon } : {}),
  });
  const pictured = (row) => ({ ...row, letter: letterOf(row.name) });
  return [
    ...catalog.bots.map((bot) => pictured({ ...common(bot), ...botRow(bot) })),
    ...catalog.plugins.map((plugin) => pictured({
      kind: 'plugin', name: plugin.name, ...common(plugin),
      ...(pages.has(plugin.repo) ? { page: pagePath(plugin.repo) } : {}),
    })),
  ];
}

/**
 * The rows of one kind whose repository, name or description holds the query, in any case.
 *
 * @param {Row[]} rows
 * @param {{query?: string, kind?: 'all' | 'bots' | 'plugins'}} filter
 */
export function filterRows(rows, { query = '', kind = 'all' } = {}) {
  const wanted = query.trim().toLowerCase();
  return rows.filter((row) => (kind === 'all' || `${row.kind}s` === kind)
    && (!wanted || [row.repo, row.name, row.description].some((text) => text.toLowerCase().includes(wanted))));
}

/**
 * The rows after the browser's re-read: the live catalog's when it read, the built ones otherwise. A plugin keeps
 * the page link only when the build made that page, and a bot its Download only when the build looked up that
 * same release's `.bmk`: the browser cannot read github.com's release pages, so a newer one waits for the next build.
 * A row the build saw at the same tag keeps what it found of the icon; a newer one shows it unchecked, over its letter.
 *
 * @param {Row[]} built
 * @param {ReturnType<typeof readCatalog> | Error | undefined} live
 * @param {Set<string>} pages
 */
export function mergeLive(built, live, pages = new Set(built.filter((row) => row.page).map((row) => row.repo))) {
  if (!live || live instanceof Error || !live.ok) return built;
  const builtRow = (row) => built.find((old) => old.kind === row.kind && old.repo === row.repo);
  return toRows(live, pages).map((row) => {
    const was = builtRow(row);
    let next = row;
    if (was && was.tag === row.tag) {
      const { icon, ...rest } = row;
      next = { ...rest, ...(was.icon ? { icon: was.icon } : {}) };
    }
    if (row.kind !== 'bot') return next;
    if (!row.bmkTag || was?.bmkTag !== row.bmkTag || was.bmkSha256 !== row.bmkSha256) return next;
    return { ...next, ...(was.download ? { download: was.download } : {}), ...(was.gone ? { gone: true } : {}) };
  });
}

function el(doc, tag, attrs = {}, ...children) {
  const node = doc.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (name === 'class') node.className = value;
    else node.setAttribute(name, value);
  }
  node.append(...children);
  return node;
}

/**
 * One row as an element; gallery.astro renders the same markup at build time.
 *
 * @param {Document} doc
 * @param {Row} row
 */
export function renderRow(doc, row) {
  const name = row.page ? el(doc, 'a', { href: row.page }, row.name) : row.name;
  const main = el(doc, 'div', { class: 'gmain' });
  // The letter is under the picture: a row with no icon.png (a 404, alt="") shows the letter, with no script.
  const icon = el(doc, 'span', { class: 'gicon', 'aria-hidden': 'true' }, row.letter ?? '?');
  if (row.icon) icon.append(el(doc, 'img', { src: row.icon, alt: '', width: '44', height: '44', loading: 'lazy' }));
  main.append(icon);
  main.append(el(doc, 'p', { class: 'gname' }, el(doc, 'b', {}, name), ' ',
    el(doc, 'span', { class: 'kind' }, row.kind === 'bot' ? 'Bot' : 'Plugin')));
  if (row.description) main.append(el(doc, 'p', { class: 'd' }, row.description));
  if (row.forkOf) {
    main.append(el(doc, 'p', { class: 'note' }, 'based on ', el(doc, 'a', { href: repoUrl(row.forkOf) }, row.forkOf)));
  }
  if (row.download) {
    main.append(
      el(doc, 'p', { class: 'gget' },
        el(doc, 'a', { class: 'btn sm primary', href: openLink(row.repo), 'data-open': row.repo }, 'Open in Studio'), ' ',
        el(doc, 'a', { class: 'gfile', href: row.download }, downloadLabel(row)), ' ',
        el(doc, 'span', { class: 'note', 'data-missed': row.repo, hidden: '' },
          'Didn\'t open? ', el(doc, 'a', { href: INSTALL }, 'Install BotMaker Studio'))),
      el(doc, 'p', { class: 'note gneeds' }, 'Needs ', el(doc, 'a', { href: INSTALL }, 'BotMaker Studio')));
  } else if (row.gone) {
    main.append(el(doc, 'p', { class: 'note' }, GONE));
  }
  return el(doc, 'li', { class: 'grow' },
    main,
    el(doc, 'span', { class: 'tag' }, row.tag),
    el(doc, 'span', { class: `rank ${row.rank}` }, RANK_LABEL[row.rank]),
    el(doc, 'span', { class: 'stars' }, el(doc, 'span', { 'aria-hidden': 'true' }, '★ '), String(row.stars),
      el(doc, 'span', { class: 'vh' }, row.stars === 1 ? ' star' : ' stars')),
    el(doc, 'a', { class: 'btn sm', href: repoUrl(row.repo) }, 'Repository'));
}

/** @param {HTMLElement} root the [data-gallery] section */
export function mount(root) {
  const $ = (name) => root.querySelector(`[data-${name}]`);
  const list = $('list');
  const built = JSON.parse(root.dataset.rows);
  const pages = new Set(JSON.parse(root.dataset.pages));
  // A restored page (back button) may bring the search box back filled.
  const filter = { query: $('search').value, kind: 'all' };
  let rows = built;
  let ok = root.dataset.ok === 'true';
  // The bots whose Open in Studio opened nothing: their "Didn't open?" line stays through a redraw.
  const missed = new Set();

  function draw() {
    const shown = filterRows(rows, filter);
    const bots = rows.filter((row) => row.kind === 'bot').length;
    // "No bots yet" answers an unfiltered look at the bots; a search that finds nothing says so instead.
    const noBots = ok && bots === 0 && filter.kind !== 'plugins' && !filter.query.trim();
    list.replaceChildren(...shown.map((row) => renderRow(document, row)));
    for (const line of list.querySelectorAll('[data-missed]')) line.hidden = !missed.has(line.dataset.missed);
    list.hidden = !ok || shown.length === 0;
    $('unreadable').hidden = ok;
    $('controls').hidden = !ok;
    $('nobots').hidden = !noBots;
    $('none').hidden = !ok || shown.length > 0 || noBots;
    $('count').textContent = ok ? `${shown.length} of ${rows.length} shown` : '';
  }

  list.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('[data-open]') : null;
    if (!(link instanceof HTMLElement)) return;
    const repo = link.dataset.open;
    // A new try starts clean: Studio may have been installed since the last miss.
    if (missed.delete(repo)) draw();
    watchOpen(window, document, () => {
      missed.add(repo);
      draw();
    });
  });
  $('search').addEventListener('input', (event) => {
    filter.query = event.target.value;
    draw();
  });
  const kinds = [...root.querySelectorAll('[data-kind]')];
  for (const button of kinds) {
    button.addEventListener('click', () => {
      filter.kind = button.dataset.kind;
      for (const other of kinds) other.setAttribute('aria-pressed', String(other === button));
      draw();
    });
  }
  draw();

  fetch(CATALOG_URL, { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
    .then(readCatalog, (error) => error)
    .then((live) => {
      const next = mergeLive(built, live, pages);
      if (next === built) return;
      rows = next;
      ok = true;
      draw();
    });
}
