# era-vlvmn-site — генератор сайта «ЭРА-Вольвоман»

Astro-проект (NTS-FAB-REG-01, S1–S8; ERA-VLVMN-SPC-01, Э1-2…Э1-6). Контент не хранит: карточки читаются из репозитория `era-vlvmn` — локально из соседнего клона `../era-vlvmn/05-content/cards/` (путь — `site.config.mjs`, `cardsDir`; переопределяется переменной `CARDS_DIR`), в CI — sparse-checkout `era-vlvmn` по секрету `CONTENT_TOKEN`. Решение Игоря 04.11.2026 (ERA-VLVMN-04, Q-1, Q-8).

## Команды (из этой папки)

```
npm ci            # зависимости по package-lock.json
npm run build     # сборка в dist/; падает при нарушении S4
npm run preview   # просмотр dist/ на http://localhost:4321
npm run dev       # разработка с перезагрузкой
```

## Что собирается

| Адрес | Источник |
|---|---|
| `/` | тексты главной — макет MKT-01 0.52; оси — `src/data/axes.json`; «частые проблемы» — первые три карточки моделей `homeModels` |
| `/models/<модель>/` | карточки, где модель есть в `models`; поколения — из названий «XC90 I (…)» |
| `/situations/<ось>/`, `/nodes/<ось>/` | классификация полей `situation`, `node` по ключевым словам `axes.json` — временная, до справочников Э2-2 |
| `/cards/vm-NNNN-<slug>/` | HTML карточки; `slug` — поле шапки, задаётся один раз при создании карточки (Q-2): блоки по NTS-FAB-01 табл. 4; JSON-LD Article + FAQPage + Organization + BreadcrumbList |
| `/cards/vm-NNNN-<slug>.md` | файл карточки как есть (S3, D-FAB-2) |
| `/cards/vm-NNNN-<slug>/sources/` | страница «Источники» (V-3.8): выдержки из файлов `evidence` по якорю `#vm-nnnn` |
| `/about/` | «О проекте»: числа из картотеки; реквизиты оператора — `site.config.mjs` |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt` | из перечня страниц `src/lib/pages.ts` |

## Проверка при сборке (S4)

Ошибка сборки: нет `code`/`slug`/`title`/`short`/`author`/`sources`/`published`; меньше двух файлов `evidence` или нет якоря; ссылка на несуществующую карточку; дубль URL; нет блока «Для каких исполнений». В режиме `closed` число вопросов-ответов вне 3–7 — предупреждение в логе; в режиме `open` — ошибка.

## Режимы и параметры — `site.config.mjs`

`mode: 'closed'` (В-15) — `noindex, nofollow` на всех страницах, плашка «закрытый тест», без Метрики. `mode: 'open'` — индексация по T3. Там же: оператор (имя в подвале), ссылка на объявления поставщика-партнёра, ссылка на Telegram-бот, список моделей.

## Публикация

GitHub Actions `.github/workflows/site.yml` → GitHub Pages; домен — `public/CNAME` (`era-volvoman.ru`). Запуск: push в `main` этого репозитория, `repository_dispatch` типа `content-updated` из `era-vlvmn` (его workflow — `era-vlvmn/.github/workflows/notify-site.yml`), вручную. Секреты: `CONTENT_TOKEN` — чтение `era-vlvmn`; в `era-vlvmn` — `SITE_DISPATCH_TOKEN` для dispatch. Pages: Source = GitHub Actions; DNS — Э0-2.
