// robots.txt по T3 (D-FAB-1). В режиме closed (В-15) закрытие — через meta robots noindex на страницах:
// ответные боты допускаются к обходу, чтобы прочитать noindex; обучающие закрыты всегда.
import type { APIRoute } from 'astro';
import { SITE } from '../../site.config.mjs';

const ALLOW = ['Googlebot', 'YandexBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Claude-SearchBot', 'Bingbot'];
const DENY = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot', 'Bytespider', 'meta-externalagent'];

export const GET: APIRoute = () => {
  let s = `# ${SITE.name} — режим: ${SITE.mode === 'closed' ? 'закрытый тест (noindex на страницах)' : 'открыт'}\n`;
  for (const b of ALLOW) s += `User-agent: ${b}\nAllow: /\n\n`;
  for (const b of DENY) s += `User-agent: ${b}\nDisallow: /\n\n`;
  s += `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}${SITE.base}/sitemap.xml\n`;
  return new Response(s, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
