// Параметры экземпляра сайта. Правятся здесь, не в шаблонах.
// Адрес и подпуть: на домене — по умолчанию; для показа на github.io — переменные SITE_URL и SITE_BASE в CI.
const BASE = (process.env.SITE_BASE || '').replace(/\/$/, '');
export const SITE = {
  url: (process.env.SITE_URL || 'https://era-volvoman.ru').replace(/\/$/, ''),
  base: BASE,
  name: 'ЭРА-Вольвоман',
  city: 'Москва',
  cities: ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург'],
  // 'closed' — закрытый тест (В-15): noindex на всех страницах, без Метрики.
  // 'open' — после приёмки: индексация по T3, Метрика (Э1-8).
  mode: 'closed',
  // Оператор. До регистрации ООО «ЭРА» — [ОТКРЫТО]: имя в подвале решает Игорь.
  operator: { name: 'Проект «ЭРА-Вольвоман»', legalName: '', inn: '', address: '' },
  // Ссылки партнёров. [ОТКРЫТО]: URL профиля Яна на Авито — от Яна.
  partnerSupplierUrl: '',
  telegramBotUrl: '',
  // Демонстрационные элементы макета MKT-01 0.53 (решение Q-4 ERA-VLVMN-06, вариант 3):
  // показываются с пометкой «условно», пока нет данных. demo: false — скрыть разом.
  demo: true,
  demoPartners: [
    { name: 'СТО «Север-Volvo» (условно)', note: 'Подвеска, диагностика · пн–сб 9–20 · ответ до 2 ч', primary: true },
    { name: '«Шведская мастерская» (условно)', note: 'Любые Volvo · пн–пт 9–18 · ответ до 4 ч', primary: false },
  ],
  // Главный эксперт картотеки (В-10). Именное подтверждение карточки — поле reviewer (станция 7).
  expert: { name: 'Ян Захарченко', initials: 'ЯЗ', url: BASE + '/experts/yan-zakharchenko/', line: 'Volvo: подвеска, ходовая, ГРМ · Москва' },
  // Картотека: соседний клон era-vlvmn; в CI — переменная CARDS_DIR (см. .github/workflows/site.yml)
  cardsDir: '../era-vlvmn/05-content/cards',
  // Модели первой версии (REQ-01 V-2.3), порядок показа
  models: ['XC90', 'XC60', 'XC70', 'S60', 'V70', 'S80', 'V60', 'XC40', 'S90'],
  // Главная (V-2.1 Т2.10): по три карточки для этих моделей
  homeModels: ['XC90', 'XC60', 'XC70'],
};
