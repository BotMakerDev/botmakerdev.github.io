// The plugins whose page is written by hand, src/content/plugins/<owner>__<repo>.md, by the `repo` in their front
// matter (named like the catalog's entry files). Their pages are built whether or not the catalog reads, so the
// SDK's and Basics' pages never depend on it; a catalog plugin without a file gets a page generated from its row.
// Only the build imports this (import.meta.glob is Vite's).

const files = import.meta.glob('../content/plugins/*.md', { eager: true });

// The same owner/name the catalog's rows are held to (catalog-read.mjs): a typo fails the build saying which file.
const REPO = /^[A-Za-z0-9-]+\/(?!\.+$)[A-Za-z0-9._-]+$/;

/** @type {Map<string, {frontmatter: Record<string, any>, Content: any}>} */
export const WRITTEN = new Map(Object.entries(files).map(([path, file]) => {
  const repo = file.frontmatter.repo;
  if (typeof repo !== 'string' || !REPO.test(repo)) throw new Error(`${path}: repo must be owner/name, not ${repo}`);
  return [repo, file];
}));
