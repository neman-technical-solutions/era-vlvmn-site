// Чтение картотеки ../05-content/cards/*.md, проверка (S4) и разбор на блоки.
// Мастер-копия карточки — .md (LOG.md 04.11.2026); сайт ничего в ней не меняет.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { SITE } from '../../site.config.mjs';
const B = SITE.base;
import axes from '../data/axes.json';

export type Card = {
  code: string;            // VM-0101
  slug: string;            // vm-0101
  url: string;             // /cards/vm-0101/
  file: string;            // абсолютный путь к .md
  raw: string;             // файл целиком (для представления .md)
  title: string;
  models: string[];
  platform: string;
  situation: string;
  node: string;
  keywords: string[];
  status: string;
  author: string;
  reviewer: string;
  published: string;       // ГГГГ-ММ-ДД
  modified: string;        // из строки «Изменено ДД.ММ.ГГГГ», иначе published
  review_by: string;
  sources: string[];
  evidence: string[];
  short: string;
  verified: boolean;       // статус «проверено» (станция 7 + D-FAB-9)
  volvoDoc: boolean;       // знак источника «документация Volvo Cars»
  // Блоки тела (NTS-FAB-01, табл. 4; REQ-01 разд. 3)
  applicability: string;   // «Для каких исполнений» — markdown-строка
  sections: Section[];     // разделы «## …» в порядке файла (без «Вопросы и ответы» и «Источники»)
  faq: Faq[];
  sourcesList: string[];   // пункты блока «Источники» (markdown)
  changelog: string;       // строка «Изменено …»
  modelKeys: ModelKey[];
  situationAxis: Axis;
  nodeAxis: Axis;
  crossRefs: string[];     // упомянутые коды VM-NNNN
};
export type Section = { title: string; body: string; html: string };
export type Faq = { q: string; a: string; qHtml: string; aHtml: string };
export type Axis = { slug: string; title: string };
export type ModelKey = { model: string; gen: string; label: string; years: string };

const CARDS_DIR = path.resolve(process.cwd(), process.env.CARDS_DIR || SITE.cardsDir);

// ---------- markdown ----------
marked.setOptions({ gfm: true, breaks: false });

/** Ссылки внутри карточки: sources/…#vm-0101 → страница «Источники»; VM-0117 → карточка. */
function rewriteLinks(md: string, card: { slug: string }, known: Map<string, string>): string {
  md = md.replace(/\]\(sources\/[^)]+\)/g, `](/cards/${card.slug}/sources/)`);
  md = md.replace(/(?<![\w/-])VM-(\d{4})(?![\w-])/g, (m, n) => {
    const target = known.get(`vm-${n}`);
    return target ? `[${m}](/cards/${target}/)` : m;
  });
  return md;
}
export function md(s: string): string {
  return marked.parse(s) as string;
}
function inline(s: string): string {
  return marked.parseInline(s) as string;
}
function strip(s: string): string {
  return s.replace(/\*\*|__|`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();
}

// ---------- оси ----------
function classify(text: string, rules: { slug: string; title: string; match: string[] }[]): Axis {
  const t = ' ' + text.toLowerCase() + ' ';
  for (const r of rules) if (r.match.some((k) => t.includes(k))) return { slug: r.slug, title: r.title };
  const last = rules[rules.length - 1];
  return { slug: last.slug, title: last.title };
}

/** «XC90 I (2002–2014)», «S40 II / V50 / C30 1.6D», «XC70 II D5» → ключи модель+поколение. */
export function parseModels(models: string[]): ModelKey[] {
  const out = new Map<string, ModelKey>();
  for (const m of models) {
    for (const part of m.split('/')) {
      const mm = part.trim().match(/^([A-Z]{1,2}\d{2})\s*(I{1,3})?/);
      if (!mm) continue;
      const model = mm[1];
      const gen = mm[2] ?? '';
      const label = gen ? `${model} ${gen}` : model;
      const years = (axes.generations as Record<string, string>)[label] ?? '';
      out.set(label, { model, gen, label, years });
    }
  }
  return [...out.values()];
}

// ---------- разбор тела ----------
function parseBody(body: string, card: Pick<Card, 'slug' | 'code'>, known: Map<string, string>) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  // убрать H1
  const h1 = lines.findIndex((l) => l.startsWith('# '));
  if (h1 >= 0) lines.splice(h1, 1);
  const text = lines.join('\n');

  const applicability = (text.match(/^\*\*Для каких исполнений:\*\*\s*(.+)$/m)?.[1] ?? '').trim();
  const changelog = (text.match(/^\*Изменено\s[^\n]*\*$/m)?.[0] ?? '').replace(/^\*|\*$/g, '');
  const modified = changelog.match(/Изменено\s+(\d{2})\.(\d{2})\.(\d{4})/);
  const modifiedIso = modified ? `${modified[3]}-${modified[2]}-${modified[1]}` : '';

  // разделы
  const parts = text.split(/^## /m);
  const sections: Section[] = [];
  const faq: Faq[] = [];
  let sourcesList: string[] = [];
  for (const p of parts.slice(1)) {
    const nl = p.indexOf('\n');
    const title = p.slice(0, nl).trim();
    let b = p.slice(nl + 1).trim();
    // хвост карточки (*Изменено…*, *Статус…*) — отрезаем от последнего раздела
    b = b.replace(/\n\*Изменено[\s\S]*$/m, '').replace(/\n\*Статус:[\s\S]*$/m, '').trim();
    if (title.startsWith('Вопросы и ответы')) {
      for (const para of b.split(/\n\s*\n/)) {
        const m = para.trim().match(/^\*\*(.+?)\*\*\s*([\s\S]+)$/);
        if (!m) continue;
        faq.push({ q: strip(m[1]), a: strip(m[2]), qHtml: inline(m[1]), aHtml: inline(rewriteLinks(m[2], card, known)) });
      }
      continue;
    }
    if (title.startsWith('Источники')) {
      sourcesList = b
        .split('\n')
        .filter((l) => l.startsWith('- '))
        .map((l) => l.slice(2).trim());
      continue;
    }
    sections.push({ title, body: b, html: md(rewriteLinks(b, card, known)) });
  }
  return { applicability, changelog, modifiedIso, sections, faq, sourcesList };
}

// ---------- загрузка ----------
let cache: Card[] | null = null;

export function loadCards(): Card[] {
  if (cache) return cache;
  if (!fs.existsSync(CARDS_DIR)) throw new Error(`Нет папки карточек: ${CARDS_DIR}`);
  const files = fs
    .readdirSync(CARDS_DIR)
    .filter((f) => /^VM-\d{4}\.md$/.test(f))
    .sort();
  // code (vm-0101) → slug адреса (vm-0101-…) — для ссылок VM-NNNN из текста
  const slugOf = new Map<string, string>();
  for (const f of files) {
    const d = matter(fs.readFileSync(path.join(CARDS_DIR, f), 'utf8')).data;
    slugOf.set(f.replace('.md', '').toLowerCase(), `${f.replace('.md', '').toLowerCase()}-${d.slug ?? ''}`);
  }
  const known = new Set(slugOf.keys());
  const errors: string[] = [];
  // В закрытом тесте (В-15) неполнота содержания — предупреждение; при открытии — ошибка сборки (S4).
  const warn: string[] = [];
  const cards: Card[] = [];
  const seen = new Set<string>();

  for (const f of files) {
    const file = path.join(CARDS_DIR, f);
    const raw = fs.readFileSync(file, 'utf8');
    const { data, content } = matter(raw);
    const code = String(data.code ?? '');
    const slugPart = String(data.slug ?? '');
    if (!/^[a-z0-9-]+$/.test(slugPart)) errors.push(`${f}: нет поля slug (латиница, дефисы) — часть постоянного адреса`);
    const slug = `${code.toLowerCase()}-${slugPart}`;
    const where = `${f}`;
    // S4: обязательные поля
    if (!code || code !== f.replace('.md', '')) errors.push(`${where}: code не совпадает с именем файла`);
    if (seen.has(slug)) errors.push(`${where}: дубль кода ${code}`);
    seen.add(slug);
    if (!data.title) errors.push(`${where}: нет title`);
    if (!data.short) errors.push(`${where}: нет краткого ответа (short)`);
    if (!data.author) errors.push(`${where}: нет автора`);
    if (!Array.isArray(data.sources) || data.sources.length === 0) errors.push(`${where}: нет первичных источников`);
    if (!data.published) errors.push(`${where}: нет published`);
    // V-3.8: два файла evidence, оба существуют, якорь есть
    const evidence: string[] = Array.isArray(data.evidence) ? data.evidence : [];
    if (evidence.length < 2) errors.push(`${where}: evidence — нужно два файла (V-3.8)`);
    for (const e of evidence) {
      const [rel, anchor] = e.split('#');
      const ep = path.join(CARDS_DIR, rel);
      if (!fs.existsSync(ep)) errors.push(`${where}: evidence не найден: ${rel}`);
      else if (anchor && !fs.readFileSync(ep, 'utf8').includes(`id="${anchor}"`)) errors.push(`${where}: в ${rel} нет якоря #${anchor}`);
    }

    const parsed = parseBody(content, { slug, code }, slugOf);
    if (parsed.faq.length < 3 || parsed.faq.length > 7) warn.push(`${where}: вопросов и ответов ${parsed.faq.length}, нужно 3–7 (NTS-FAB-01, табл. 4)`);
    if (!parsed.applicability) errors.push(`${where}: нет блока «Для каких исполнений»`);

    // ссылки на несуществующие карточки
    const bodyNoChangelog = content.replace(/^\*Изменено\s[^\n]*\*$/m, '');
    const crossRefs = [...new Set((bodyNoChangelog.match(/VM-\d{4}/g) ?? []).filter((c) => c !== code))];
    for (const r of crossRefs) if (!known.has(r.toLowerCase())) errors.push(`${where}: ссылка на несуществующую карточку ${r}`);

    const status = String(data.status ?? '');
    const models: string[] = Array.isArray(data.models) ? data.models : [];
    const situation = String(data.situation ?? '');
    const node = String(data.node ?? '');
    const sourcesArr: string[] = Array.isArray(data.sources) ? data.sources : [];

    cards.push({
      code,
      slug,
      url: B + `/cards/${slug}/`,
      file,
      raw,
      title: String(data.title ?? ''),
      models,
      platform: String(data.platform ?? ''),
      situation,
      node,
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      status,
      author: String(data.author ?? ''),
      reviewer: String(data.reviewer ?? ''),
      published: String(data.published ?? ''),
      modified: parsed.modifiedIso || String(data.published ?? ''),
      review_by: String(data.review_by ?? ''),
      sources: sourcesArr,
      evidence,
      short: String(data.short ?? ''),
      verified: /^проверено/i.test(status) && !!data.reviewer,
      volvoDoc: sourcesArr.some((s) => /volvo cars|volvocars\.com|vida|tech info/i.test(s)),
      applicability: parsed.applicability,
      sections: parsed.sections,
      faq: parsed.faq,
      sourcesList: parsed.sourcesList,
      changelog: parsed.changelog,
      modelKeys: parseModels(models),
      situationAxis: classify(situation, axes.situations),
      nodeAxis: classify(node + ' ' + situation, axes.nodes),
      crossRefs,
    });
  }
  if (SITE.mode !== 'closed') errors.push(...warn);
  else if (warn.length) console.warn(`[cards] Замечания к содержанию (в режиме open — ошибка сборки):\n  ` + warn.join('\n  '));
  if (errors.length) throw new Error(`Картотека не прошла проверку (S4):\n  ` + errors.join('\n  '));
  cache = cards;
  return cards;
}

export function cardsByModel(model: string): Card[] {
  return loadCards().filter((c) => c.modelKeys.some((k) => k.model === model));
}

/** Выдержка из файла evidence по якорю: от <a id="vm-0101"> до следующего <a id=…>. */
export function evidenceExcerpt(card: Card, ref: string): { file: string; title: string; html: string } {
  const [rel, anchor] = ref.split('#');
  const src = fs.readFileSync(path.join(CARDS_DIR, rel), 'utf8').replace(/\r\n/g, '\n');
  const title = src.match(/^#\s+(.+)$/m)?.[1] ?? rel;
  const start = src.indexOf(`<a id="${anchor}"></a>`);
  if (start < 0) throw new Error(`${card.code}: в ${rel} нет якоря #${anchor}`);
  const rest = src.slice(start + `<a id="${anchor}"></a>`.length);
  const next = rest.search(/\n<a id="/);
  const chunk = (next >= 0 ? rest.slice(0, next) : rest).trim();
  return { file: rel, title, html: md(chunk) };
}

export const AXES = axes;
