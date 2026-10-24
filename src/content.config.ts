// Starlight's docs collection. The plugin pages in src/content/plugins/ are not a collection: src/lib/written.mjs
// reads them with import.meta.glob.
import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
