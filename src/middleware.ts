// Starlight writes `data-theme="dark"` into every docs page's <html> and lets its script correct it. Without
// JavaScript that would leave the docs dark whatever the system says, while the site's other pages follow it. The
// attribute is taken out at build time: the head script (src/lib/theme.mjs) still sets it, and without it the
// tokens and the code blocks follow the system setting, as on every other page.
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (!response.headers.get('content-type')?.startsWith('text/html')) return response;
  const html = await response.text();
  const page = html.replace(/(<html\b[^>]*?)\s+data-theme="dark"/, '$1');
  return new Response(page, response);
});
