import type { APIRoute } from 'astro';
import { allPages } from '../lib/pages';
import { SITE } from '../../site.config.mjs';

export const GET: APIRoute = () => {
  const items = allPages()
    .map((p) => `  <url><loc>${SITE.url}${p.url}</loc><lastmod>${p.lastmod}</lastmod></url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
