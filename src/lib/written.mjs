// The plugins whose page is written by hand, src/content/plugins/<id>.md, by id. Their pages are built whether or
// not the catalog reads, so the SDK's and Basics' pages never depend on it; a catalog plugin without a file gets
// a page generated from its row. Only the build imports this (import.meta.glob is Vite's).

const files = import.meta.glob('../content/plugins/*.md', { eager: true });

/** @type {Map<string, {frontmatter: Record<string, any>, Content: any}>} */
export const WRITTEN = new Map(Object.values(files).map((file) => [file.frontmatter.id, file]));
