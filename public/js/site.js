/* ERA-VLVMN — интерактив сайта на дизайн-системе ЭРА (ERA-VLVMN-09, 09.11.2026).
   Главная: выбор машины и пробега, диалог с ИИ-механиком по картотеке (window.CARDS), демонстрация контроля ТО.
   Раздел модели: фильтры по осям. Карточки из данных: /to/ и /cons/.
   Состояние (машина, пробег, город) — в localStorage браузера; на сервер ничего не уходит (решение 09.11.2026). */
var B = window.B || '';
var $ = function (id) { return document.getElementById(id); };
var fmt = function (n) { return Number(n).toLocaleString('ru'); };
var nextTO = function (o) { return Math.ceil((o + 1) / 15000) * 15000; };
var S = {};
try { S = JSON.parse(localStorage.getItem('vm') || '{}') || {}; } catch (e) {}
function save() { try { localStorage.setItem('vm', JSON.stringify(S)); } catch (e) {} }
var page = document.body.dataset.page || '';
var car = S.car || null, odo = S.odo || null;

/* Город */
function setCity(c) { S.city = c; save(); document.querySelectorAll('.c').forEach(function (e) { e.textContent = c || 'Россия'; }); var m = $('city-menu'); if (m && !m.hidden) toggleCity(); }
function toggleCity() { var m = $('city-menu'), b = $('city-btn'); if (!m) return; m.hidden = !m.hidden; if (b) b.setAttribute('aria-expanded', String(!m.hidden)); }
if (S.city !== undefined) document.querySelectorAll('.c').forEach(function (e) { e.textContent = S.city || 'Россия'; });

/* Голос — демонстрация: подставляет образец */
function voice(id) { var e = $(id); if (!e) return; e.focus(); e.value = id === 'odo' ? '187 026' : id === 'tel' ? '+7 999 123-45-67' : 'Гул с 60–80 км/ч, меняется в повороте'; if (id === 'odo') odoTyped(); }

/* ---------- Главная ---------- */
var dlg = $('dialog');
function el(h) { var d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild; }
function say(html, prompt) { if (!dlg) return; dlg.appendChild(el('<article class="speech t-speech' + (prompt ? ' is-prompt' : '') + '"><span class="who t-label">ИИ-механик</span><p>' + html + '</p></article>')); }
function user(t) { dlg.appendChild(el('<div class="user t-speech"></div>')); dlg.lastChild.textContent = t; }
function setSel(id) { var s = $(id); if (s) s.classList.toggle('empty', !s.value); }
function odoTyped() { var o = parseInt(($('odo').value || '').replace(/\D/g, ''), 10); odo = o || null; S.odo = odo; save(); }
var CARDS = window.CARDS || [];
function cardsFor(m) { return CARDS.filter(function (c) { return c.general || c.models.indexOf(m) >= 0; }); }
function findCard(t, m) {
  var words = t.toLowerCase().replace(/ё/g, 'е').split(/[^a-zа-я0-9]+/).filter(function (w) { return w.length > 2; });
  var best = null, score = 0;
  CARDS.forEach(function (c) {
    var hay = (c.title + ' ' + c.keywords.join(' ')).toLowerCase().replace(/ё/g, 'е');
    var s = 0; words.forEach(function (w) { var stem = w.slice(0, Math.max(4, w.length - 2)); if (hay.indexOf(stem) >= 0) s += 1; });
    if (s && m && c.models.indexOf(m) >= 0) s += 0.5;
    if (s > score) { score = s; best = c; }
  });
  return score ? best : null;
}
function carChanged() {
  setSel('m'); setSel('y');
  var m = $('m').value, y = $('y').value; if (!(m && y)) return;
  car = { m: m, y: y }; S.car = car; save();
  dlg.innerHTML = '';
  var nx = odo ? nextTO(odo) : null;
  say('Volvo ' + m + ', ' + y + (odo ? ', пробег ' + fmt(odo) + ' км — ближайшее ТО около ' + fmt(nx) + ' км' : '') + '. Чаще всего по ' + m + ' спрашивают:', true);
  var list = el('<div class="faqlist list"></div>');
  var rows = [{ title: 'Ближайшее ТО: что менять по пробегу и году выпуска', url: B + '/to/' }, { title: 'Запчасти и расходники: масло, фильтры, дворники, лампы', url: B + '/cons/' }].concat(cardsFor(m).slice(0, 5));
  rows.forEach(function (c) { var a = el('<a class="row" href="' + c.url + '"><span class="t"></span></a>'); a.querySelector('.t').textContent = c.title; list.appendChild(a); });
  dlg.appendChild(list);
  say('Что беспокоит? Опишите своими словами — или выберите из списка.', true);
  dlg.appendChild(el('<div class="replies"><button class="reply is-primary t-button" type="button" onclick="ask(\'Ближайшее ТО\')">Ближайшее ТО</button><button class="reply is-secondary t-button" type="button" onclick="ask(\'Запчасти и расходники\')">Запчасти и расходники</button></div>'));
}
function ask(t) {
  var inp = $('q'); t = t || inp.value.trim(); if (!t) return false; inp.value = '';
  user(t); setTimeout(function () { reply(t); }, 250); return false;
}
function reply(t) {
  if (!car) {
    var mm = t.match(/XC90|XC60|XC70|S60|V70|S80|XC40|V60|S90/i);
    if (mm) { $('m').value = mm[0].toUpperCase(); if (!$('y').value) $('y').value = '2010'; carChanged(); return; }
    say('С какой Volvo вопрос? Выберите модель и год выше — отвечу точнее.', true); return;
  }
  var m = car.m;
  var src = function (u, n) { return '<br><span class="t-meta">Эксперт ответа: ' + (window.EXPERT || 'эксперт картотеки') + ' · Источник: <a href="' + u + '">' + n + '</a></span>'; };
  if (/(^|[^а-яё])то([^а-яё]|$)|обслуж|регламент/i.test(t)) {
    var next = odo ? nextTO(odo) : null;
    say((next ? 'Ближайшее ТО для Volvo ' + m + ' — <b>' + fmt(next) + ' км</b> (через ' + fmt(next - odo) + ' км) или через 12 месяцев после прошлого, что раньше. ' : 'Укажите пробег над диалогом — посчитаю ближайшее ТО. ') + 'Состав работ по пробегу и году — в карточке.' + src(B + '/to/', 'VM-0040 Ближайшее ТО'));
    return;
  }
  if (/запчаст|расходник|масл|дворник|щетк|щётк|ламп|антифриз|омыва|жидкост/i.test(t)) {
    var c0 = findCard(t, m);
    if (!c0 || !/масл|дворник|щетк|щётк|ламп|антифриз|омыва|жидкост|расходник/i.test(c0.title + c0.keywords.join(' '))) {
      say('Запчасти и расходники для Volvo ' + m + ': допуски масла, антифриз VCS, дворники, лампы, периодичность и ориентир цен — в карточке.' + src(B + '/cons/', 'VM-0041 Запчасти и расходники')); return;
    }
  }
  var c = findCard(t, m);
  if (c) { var a = el('<article class="speech t-speech"><span class="who t-label">ИИ-механик</span><p></p></article>'); a.querySelector('p').textContent = c.short; a.querySelector('p').insertAdjacentHTML('beforeend', src(c.url, c.code + ' ' + c.title)); dlg.appendChild(a); return; }
  say('<b>В картотеке такая проблема не описана.</b> Тема уйдёт в план публикаций. Спросить эксперта напрямую — контакты ниже.');
}
function toControl() {
  var h = $('to-hint'), o = parseInt(($('odo').value || '').replace(/\D/g, ''), 10), t = ($('tel').value || '').replace(/\D/g, '');
  if (!car) { h.innerHTML = '<b>Выберите модель и год</b> — без них интервал ТО не определить.'; return false; }
  if (!o) { h.innerHTML = '<b>Укажите пробег</b> под моделью и годом — по нему считаем срок ТО.'; return false; }
  if (t.length < 10) { h.innerHTML = '<b>Укажите телефон</b> — по нему придёт напоминание.'; return false; }
  odo = o; S.odo = o; var next = nextTO(o);
  $('to-ok-text').textContent = 'Volvo ' + car.m + ', ' + car.y + ', ' + fmt(o) + ' км — на контроле ТО. Напомним за 1 500 км до ТО на ' + fmt(next) + ' км.';
  $('to-ok').hidden = false;
  h.textContent = window.DEMO ? 'Демонстрация: данные остаются в вашем браузере.' : 'Напоминание включено.';
  S.to = { car: car, odo: o, ts: Date.now() }; save(); /* телефон не сохраняется и не передаётся */
  return false;
}
if (page === 'home') {
  if ($('q')) $('q').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ask(); } });
  if (car) { $('m').value = car.m; $('y').value = car.y; }
  if (odo) $('odo').value = fmt(odo);
  if (car) carChanged();
}

/* ---------- Раздел модели: фильтры по осям ---------- */
if (page === 'model') {
  var filterRows = function () {
    var g = document.querySelector('.axes[data-axis=gen] button.on'), s = document.querySelector('.axes[data-axis=sit] button.on');
    var gv = g ? g.dataset.v : '', sv = s ? s.dataset.v : '', n = 0;
    document.querySelectorAll('.list .row[data-gen]').forEach(function (r) {
      var ok = (!gv || r.dataset.gen.split('|').indexOf(gv) >= 0 || r.dataset.gen === '*') && (!sv || r.dataset.sit === sv);
      r.hidden = !ok; if (ok) n++;
    });
    var e = $('empty'); if (e) e.hidden = n > 0;
  };
  document.querySelectorAll('.axes[data-axis]').forEach(function (ax) {
    ax.querySelectorAll('button').forEach(function (b) { b.onclick = function () { ax.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); filterRows(); }; });
  });
}

/* ---------- Карточки из данных: «Ближайшее ТО» и «Запчасти и расходники» (VM-0040/0041 [О]) ---------- */
function toCard() {
  var m = car ? car.m : 'XC90', y = car ? parseInt(car.y, 10) : null, o = odo || null, age = y ? 2026 - y : null;
  var next = o ? nextTO(o) : null, k = next ? next / 15000 : null;
  var base = ['Масло моторное 0W-30 A5/B5, 6,5–7 л', 'Фильтр масляный', 'Фильтр воздушный', 'Фильтр салона', 'Осмотр подвески, тормозов, течей'];
  var extra = [];
  if (k && k % 2 === 0) extra.push('Тормозная жидкость — каждые 2 года или 30 000 км');
  if (k && k % 4 === 0) extra.push('Свечи зажигания (бензин) — 60 000 км; топливный фильтр (дизель)');
  if (k && k % 6 === 0) extra.push('Масло АКПП — 90 000 км (ориентир; Volvo заявляет «на весь срок»)');
  if (next && next >= 180000 && next % 180000 < 15000) extra.push('Ремень ГРМ с роликами и помпой (D5, бензин 5-цил.) — 180 000 км или 10 лет');
  if (age && age >= 10) extra.push('По возрасту ' + age + ' лет: ремень ГРМ, если не менялся 10 лет; охлаждающая жидкость; тормозные шланги — осмотр');
  var ans = next ? 'Ближайшее ТО для Volvo ' + m + (y ? ' ' + y : '') + ' при пробеге ' + fmt(o) + ' км — на <b>' + fmt(next) + ' км</b>, через ' + fmt(next - o) + ' км или 12 месяцев после прошлого, что наступит раньше. Базовый состав — масло и три фильтра, 8–14 тыс. ₽ с работой [О]; на этом пробеге добавляется: ' + (extra.length ? extra.map(function (x) { return x.split(' — ')[0].toLowerCase(); }).join(', ') : 'ничего сверх базового') + '.' : 'Укажите модель, год и пробег на главной — карточка посчитает ближайшее ТО. Регламент Volvo: каждые 15 000 км или 12 месяцев; состав работ меняется на 30, 60, 90 и 180 тыс. км и после 10 лет.';
  return { id: 'VM-0040', title: 'Ближайшее ТО Volvo ' + m + (y ? ' ' + y + ' г.' : '') + ': что менять' + (next ? ' на ' + fmt(next) + ' км' : '') + ' — регламент по пробегу и году',
    ans: ans, fit: m + (y ? ', ' + y + ' г.' : '') + '; интервал 15 000 км / 12 мес — ориентир для большинства моделей и двигателей, точный — по комплектации',
    signsTitle: 'Когда пора', signs: ['Подошёл пробег или год с прошлого ТО', 'Сообщение на панели «Время обслуживания»'],
    causesTitle: 'Состав работ на ближайшем ТО', causes: base.concat(extra.map(function (x) { return '<b>' + x + '</b>'; })),
    self: ['Проверить уровень масла и охлаждающей жидкости', 'Найти дату и пробег прошлого ТО по сервисной книжке или наклейке под капотом'],
    safety: 'Тормозная жидкость и тормозные шланги старше 4 лет — только к специалисту.',
    faq: [['Можно ли ездить дольше 15 000 км между ТО?', 'Volvo допускает до 20 000 км на некоторых рынках с маслом A5/B5; в российских условиях мастера советуют 10–15 тыс.'], ['Что обязательно по году, а не по пробегу?', 'Масло и тормозная жидкость стареют по времени: 12 и 24 месяца независимо от пробега.']],
    checked: '30.10.2026', until: '30.04.2027' };
}
function consCard() {
  var m = car ? car.m : 'XC90', y = car ? car.y : null; var de = /XC40|S90|V60|XC60/.test(m) && y && parseInt(y, 10) >= 2015;
  return { id: 'VM-0041', title: 'Запчасти и расходники Volvo ' + m + (y ? ' ' + y + ' г.' : '') + ': масло, фильтры, дворники, лампы, жидкости — что подходит и сколько ходит',
    ans: 'Для Volvo ' + m + (y ? ' ' + y : '') + ': моторное масло ' + (de ? '0W-20 по спецификации Volvo VCC RBS0-2AE (Drive-E)' : '0W-30 или 5W-30 ACEA A5/B5') + ', 6,5–7 л с фильтром; антифриз только Volvo VCS (жёлто-зелёный, не смешивать с G12/G13); тормозная жидкость DOT 4; дворники ' + (/XC90/.test(m) ? '26″ и 20″ (XC90 I), 24″ и 20″ (XC90 II)' : 'по комплектации') + ', крючок или штык; лампы ближнего ' + (/XC90|XC70|S80/.test(m) ? 'H7 (галоген) или D2R (ксенон)' : 'H7 / LED по комплектации') + '. Полный комплект на год — 12–20 тыс. ₽ в ценах Москвы, ноябрь 2026 [О].',
    fit: m + (y ? ', ' + y + ' г.' : '') + '; тип лампы, дворников и масла зависит от комплектации и двигателя',
    signsTitle: 'Периодичность замены', signs: ['Масло — каждые 15 000 км или 12 мес', 'Дворники — раз в год, перед зимой', 'Антифриз — 5 лет или 150 000 км (VCS)', 'Тормозная жидкость — 2 года', 'Лампы — по факту; ксенон D2R — парой'],
    causesTitle: 'Что покупать: позиции и ориентир цен [О]', causes: ['Масло моторное ' + (de ? '0W-20 VCC RBS0-2AE, 5,5 л' : '0W-30 A5/B5, 7 л') + ' — 5 200–7 800 ₽', 'Фильтр масляный (Mann, Mahle, Volvo) — 600–1 400 ₽', 'Фильтр воздушный — 900–2 100 ₽; салонный угольный — 700–1 900 ₽', 'Дворники бескаркасные (Bosch Aerotwin, Volvo) — 2 500–4 500 ₽ пара', 'Лампы H7 (Osram, Philips) — 600–1 500 ₽ пара; D2R ксенон — 4 000–9 000 ₽ пара', 'Антифриз Volvo VCS концентрат 4 л — 2 500–3 500 ₽', 'Жидкость омывателя зимняя −25 °C — 300–600 ₽'],
    self: ['Сверить допуск масла на крышке маслозаливной горловины или в руководстве', 'Проверить тип крепления дворников и длину', 'Доливать антифриз только VCS: другой цвет — повод к сервису'],
    safety: 'Тормозная жидкость, лампы фар при неработающем корректоре и ксенон — замена у специалиста.',
    faq: [['Какое масло лить в Volvo XC90 I?', '0W-30 или 5W-30 ACEA A5/B5; 5W-40 — не для этих моторов (ресурс гидрокомпенсаторов).'], ['Можно ли залить обычный антифриз G12?', 'Нет: Volvo VCS несовместим с G12/G13, смесь даёт осадок в радиаторе печки.'], ['Какие дворники на XC90 I?', '26″ водительский и 20″ пассажирский, крепление крючок; на XC90 II — 24″/20″, штык.'], ['Какой ресурс у ламп H7?', 'Стандартные — 500–700 ч; «+150 %» — 150–250 ч, ярче, но меняются парой каждый год.']],
    checked: '30.10.2026', until: '30.04.2027' };
}
function renderGen(k) {
  var e = $('gen'); if (!e) return;
  var c = k === 'to' ? toCard() : consCard();
  var li = function (a) { return a.map(function (x) { return '<li>' + x + '</li>'; }).join(''); };
  e.innerHTML = '<p class="crumbs t-meta"><a href="' + B + '/">Главная</a> › ' + (car ? '<a href="' + B + '/models/' + car.m.toLowerCase() + '/">' + car.m + '</a>' : 'Общие') + ' › ' + (k === 'to' ? 'ТО' : 'Запчасти и расходники') + '</p>' +
    '<p class="t-overline">Карточка · ' + c.id + ' · из данных · оценка редакции [О], требует подтверждения экспертом</p>' +
    '<h1 class="t-date">' + c.title + '</h1><div class="answer t-speech"><p>' + c.ans + '</p></div><p class="fit t-meta"><b>Для каких исполнений:</b> ' + c.fit + '</p><div class="sec">' +
    '<h3>' + c.signsTitle + '</h3><ul>' + li(c.signs) + '</ul><h3>' + c.causesTitle + '</h3><ul>' + li(c.causes) + '</ul>' +
    '<h3>Что проверить самому</h3><ul>' + li(c.self) + '</ul><h3>Когда ехать к специалисту</h3><div class="safety">' + c.safety + '</div>' +
    '<h3>Вопросы и ответы</h3><div class="faq">' + c.faq.map(function (q) { return '<details><summary>' + q[0] + '</summary><p>' + q[1] + '</p></details>'; }).join('') + '</div></div>' +
    '<div class="meta t-meta"><span>Составлено: ' + c.checked + ' · пересмотр до ' + c.until + '</span><span>Автор: редакция ЭРА-Вольвоман · Подтверждение экспертом — ожидается</span><span>Источники: <a href="https://www.volvocars.com/ru/support/" target="_blank" rel="noopener">документация Volvo Cars (руководства владельца)</a>; регламент ТО Volvo; ориентиры цен Москвы, ноябрь 2026 [О]</span><span>Материал информационный и не заменяет диагностику у специалиста. Текст подготовлен с помощью ИИ; ответственность за рекомендации — оператор сайта и эксперт, указанный в ответе</span></div>';
}
if (page === 'to') renderGen('to');
if (page === 'cons') renderGen('cons');
