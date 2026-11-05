// Индекс картотеки для ссылок из ответов ИИ-механика (public/js/site.js): код, адрес, заголовок, модели, ключевые слова.
import type { APIRoute } from 'astro';
import { loadCards } from '../lib/cards';

export const GET: APIRoute = () => {
  const list = loadCards().map((c) => ({
    code: c.code,
    url: c.url,
    title: c.title,
    models: [...new Set(c.modelKeys.map((k) => k.model))],
    keywords: c.keywords,
    situation: c.situationAxis.slug,
    node: c.nodeAxis.slug,
  }));
  return new Response(JSON.stringify(list), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
