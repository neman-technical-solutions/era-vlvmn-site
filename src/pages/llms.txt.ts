// llms.txt (T8): индекс разделов из того же перечня страниц, что sitemap.
import type { APIRoute } from 'astro';
import { allPages } from '../lib/pages';
import { loadCards } from '../lib/cards';
import { SITE } from '../../site.config.mjs';

export const GET: APIRoute = () => {
  const pages = allPages();
  const groups = [...new Set(pages.map((p) => p.group))];
  const n = loadCards().length;
  let s = `# ${SITE.name}\n\n> Картотека по эксплуатации и ремонту Volvo: ${n} карточек — симптом, причины по частоте, что проверить самому, когда к специалисту, запчасти. Каждая карточка доступна в Markdown по тому же адресу с суффиксом .md. Не официальный ресурс Volvo Cars.\n\n`;
  for (const g of groups) {
    s += `## ${g}\n\n`;
    for (const p of pages.filter((p) => p.group === g)) {
      const u = p.group === 'Карточки' ? `${SITE.url}${p.url.replace(/\/$/, '')}.md` : `${SITE.url}${p.url}`;
      s += `- [${p.title}](${u})\n`;
    }
    s += '\n';
  }
  return new Response(s, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
