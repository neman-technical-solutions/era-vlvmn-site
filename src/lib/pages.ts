// Перечень страниц сайта для sitemap и llms.txt (S5) — собирается из данных.
import { loadCards, cardsByModel, AXES } from './cards';
import { SITE } from '../../site.config.mjs';
const B = SITE.base;

export type PageRec = { url: string; lastmod: string; title: string; group: string };

export function allPages(): PageRec[] {
  const cards = loadCards();
  const latest = cards.map((c) => c.modified).sort().at(-1) ?? '';
  const out: PageRec[] = [
    { url: B + '/', lastmod: latest, title: 'Главная', group: 'Разделы' },
    { url: B + '/about/', lastmod: latest, title: 'О проекте', group: 'Разделы' },
    { url: B + '/models/', lastmod: latest, title: 'Модели Volvo', group: 'Разделы' },
  ];
  for (const m of SITE.models) {
    const cs = cardsByModel(m);
    out.push({ url: B + `/models/${m.toLowerCase()}/`, lastmod: cs.map((c) => c.modified).sort().at(-1) ?? latest, title: `Volvo ${m}: неисправности, ТО и запчасти по поколениям`, group: 'Модели' });
  }
  for (const s of AXES.situations) {
    const cs = cards.filter((c) => c.situationAxis.slug === s.slug);
    if (cs.length) out.push({ url: B + `/situations/${s.slug}/`, lastmod: cs.map((c) => c.modified).sort().at(-1)!, title: `Ситуация: ${s.title}`, group: 'Ситуации' });
  }
  for (const s of AXES.nodes) {
    const cs = cards.filter((c) => c.nodeAxis.slug === s.slug);
    if (cs.length) out.push({ url: B + `/nodes/${s.slug}/`, lastmod: cs.map((c) => c.modified).sort().at(-1)!, title: `Узел: ${s.title}`, group: 'Узлы' });
  }
  for (const c of cards) {
    out.push({ url: c.url, lastmod: c.modified, title: c.title, group: 'Карточки' });
    out.push({ url: `${c.url}sources/`, lastmod: c.modified, title: `Источники: ${c.code}`, group: 'Источники карточек' });
  }
  // дубли адресов — ошибка сборки (S4)
  const seen = new Set<string>();
  for (const p of out) { if (seen.has(p.url)) throw new Error(`Дубль URL: ${p.url}`); seen.add(p.url); }
  return out;
}
