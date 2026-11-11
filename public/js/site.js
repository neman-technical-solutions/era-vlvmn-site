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
  var rows = [{ title: 'ТО: что делают по пробегу и какое масло', url: B + '/to/' }, { title: 'Расходники: масло, фильтры, свечи', url: B + '/cons/' }].concat(cardsFor(m).slice(0, 5));
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
    say((next ? 'Ближайшее ТО для Volvo ' + m + ' — <b>' + fmt(next) + ' км</b> (через ' + fmt(next - odo) + ' км) или через 12 месяцев после прошлого, что раньше. ' : 'Укажите пробег над диалогом — посчитаю ближайшее ТО. ') + 'Пробег — ориентир при интервале 15 000 км; точный интервал — в сервисной книжке. Состав работ и масло — в карточках ТО.' + src(B + '/to/', 'Карточки ТО'));
    return;
  }
  if (/запчаст|расходник|масл|дворник|щетк|щётк|ламп|антифриз|омыва|жидкост/i.test(t)) {
    var c0 = findCard(t, m);
    if (!c0 || !/масл|дворник|щетк|щётк|ламп|антифриз|омыва|жидкост|расходник/i.test(c0.title + c0.keywords.join(' '))) {
      say('Запчасти и расходники для Volvo ' + m + ': масло и фильтры — в карточках ТО; по остальным позициям спросите ИИ-механика в Telegram.' + src(B + '/cons/', 'Расходники')); return;
    }
  }
  var c = findCard(t, m);
  if (c) { var a = el('<article class="speech t-speech"><span class="who t-label">ИИ-механик</span><p></p></article>'); a.querySelector('p').textContent = c.short; a.querySelector('p').insertAdjacentHTML('beforeend', src(c.url, c.code + ' ' + c.title)); dlg.appendChild(a); return; }
  say('<b>В картотеке такая проблема не описана.</b> Тема уйдёт в план публикаций. Спросить эксперта напрямую — контакты ниже.');
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

/* Страницы /to/ и /cons/ с 11.11.2026 статические (to.astro, cons.astro): шаблон VM-0040/0041 с числами [О] снят (LOG ERA-VLVMN-18). */
