var B = window.B || '';
/* ERA-VLVMN — интерактив макета MKT-01 0.53, перенесённый на многостраничный сайт (ERA-VLVMN-06, Q-3 вариант 1, Q-4 вариант 3).
   Имитации камер, ответы ИИ-механика и заявки — демонстрационные: распознавание и база заявок на сайте не реализованы.
   Состояние (машина, пробег, город) живёт в localStorage между страницами. */

var S = {};
try { S = JSON.parse(localStorage.getItem('vm') || '{}'); } catch (e) { S = {}; }
function save() { try { localStorage.setItem('vm', JSON.stringify(S)); } catch (e) {} }
var myCar = S.car || null;
var st = { odo: S.odo || null, m: myCar ? myCar.m : null, vin: myCar ? myCar.vin : null };
var page = document.body.dataset.page || '';
var $ = function (id) { return document.getElementById(id); };
var fmt = function (n) { return Number(n).toLocaleString('ru'); };
var nextTO = function (o) { return Math.ceil((o + 1) / 15000) * 15000; };

/* Картотека для ссылок из ответов ИИ-механика: /cards.json собирается при сборке. */
var INDEX = null;
fetch(B+'/cards.json').then(function (r) { return r.json(); }).then(function (j) { INDEX = j; }).catch(function () {});
function findCard(re, m) {
  if (!INDEX) return null;
  var rx = new RegExp(re, 'i');
  var hit = function (c) { return rx.test(c.title + ' ' + c.keywords.join(' ')); };
  var c = INDEX.find(function (c) { return (!m || c.models.indexOf(m) >= 0 || !c.models.length) && hit(c); }) || INDEX.find(hit);
  return c || null;
}
function cardLink(re, label) {
  var c = findCard(re, st.m);
  var u = c ? c.url : (st.m ? B+'/models/' + st.m.toLowerCase() + '/' : B+'/models/');
  return '<a href="' + u + '">' + (c ? c.code + ' ' + c.title : label) + '</a>';
}

/* Город */
function setCity(c) { S.city = c; save(); document.querySelectorAll('.c').forEach(function (e) { e.textContent = c; }); }
(function () { var sel = $('city'); if (sel) { if (S.city) sel.value = S.city; setCity(sel.value); } })();
function goBack() { if (history.length > 1) history.back(); else location.href = B+'/'; }
function track(x) { console.log('goal:', x); }
function voice() { var q = $('q'); if (q) { q.placeholder = 'Диктовка появится после подключения ИИ-механика'; q.focus(); } }

/* Машина: VIN, модель и год, пробег (главная) */
function showCar(how) {
  var out = $('car'); if (!out || !myCar) return;
  out.className = 'car on';
  out.innerHTML = how + ': <b>Volvo ' + myCar.m + (myCar.gen ? ' ' + myCar.gen : '') + ', ' + myCar.y + (myCar.eng ? ', ' + myCar.eng : '') + '</b>';
}
function applyFaq() {
  var box = $('faq-box'); if (!box || !myCar) return;
  box.hidden = false;
  $('faq-h').textContent = 'Наиболее частые вопросы Volvo ' + myCar.m + ' за последний месяц';
  document.querySelectorAll('#faq-list .row').forEach(function (r) { var m = r.dataset.m; r.hidden = !!(m && m !== myCar.m); });
}
function setCar(c, how) {
  myCar = c; st.m = c.m; st.vin = c.vin || null; S.car = c; save();
  showCar(how); applyFaq();
}
function shootVin() { var c = $('vcam'); c.hidden = false; document.querySelector('.vin-odom').classList.remove('scan'); $('vcam-st').textContent = 'Фото не сохраняется — распознаём и удаляем'; c.scrollIntoView({ block: 'nearest' }); }
function snapVin() { document.querySelector('.vin-odom').classList.add('scan'); $('vcam-st').textContent = 'Распознано: YV1CZ59H8A1234567'; $('vin').value = 'YV1CZ59H8A1234567'; vinTyped('по фото VIN'); $('vcam').hidden = true; }
function vinTyped(how) {
  var v = ($('vin').value || '').toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''); $('vin').value = v;
  if (v.length !== 17) return;
  /* образец распознавания из макета; разбор VIN по таблице кодов — модуль подбора (/podbor/) */
  setCar({ m: 'XC90', gen: 'I', y: '2008', eng: '2.5T', vin: v }, (how || 'Определено по VIN') + ' (образец распознавания; фото не сохраняется)');
  $('m').value = 'XC90'; $('y').value = '2008';
}
function autoCar() { if ($('m').value && $('y').value) pickCar(); }
function pickCar() {
  var m = $('m').value, y = $('y').value;
  if (m && y) setCar({ m: m, y: y }, 'Ваш автомобиль');
  else { var o = $('car'); o.className = 'car on'; o.textContent = 'Введите VIN или выберите модель и год'; }
}
function shootOdo() { var c = $('cam'); c.hidden = false; document.querySelector('.odom').classList.remove('scan'); $('cam-st').textContent = 'Фото не сохраняется — распознаём и удаляем'; c.scrollIntoView({ block: 'nearest' }); }
function snapOdo() { document.querySelector('.odom').classList.add('scan'); $('cam-st').textContent = 'Распознано: 187 026 км'; $('odo').value = '187 026'; odoTyped('по фото счётчика'); $('cam').hidden = true; }
function odoTyped(how) {
  var o = parseInt(($('odo').value || '').replace(/\D/g, ''), 10); if (!o) return;
  st.odo = o; S.odo = o; save();
  var out = $('car'); out.className = 'car on';
  var car = myCar ? 'Volvo ' + myCar.m + (myCar.gen ? ' ' + myCar.gen : '') + ', ' + myCar.y : 'автомобиль не указан';
  out.innerHTML = '<b>' + car + '</b> · пробег ' + fmt(o) + ' км' + (how ? ' (' + how.toLowerCase() + ')' : '') + ' · следующее ТО — ' + fmt(nextTO(o)) + ' км (ориентир) · <a href="/to/">что менять на ТО</a>';
}
function remindTO() {
  var t = $('tel').value.trim(), h = $('tel-hint');
  if (!/\d{7,}/.test(t)) { h.textContent = 'Введите номер телефона'; return; }
  var o = st.odo;
  h.innerHTML = '<b style="color:var(--ok)">Напоминание включено</b>: ' + (o ? 'за 1 500 км до ' + fmt(nextTO(o)) + ' км и за месяц' : 'укажите пробег — рассчитаем срок') + '. Раз в неделю пришлём просьбу сфотографировать пробег. Отписка — словом «стоп». Оператор данных — ООО «ЭРА».';
}
if (page === 'home') {
  var ysel = $('y'); for (var yy = 2026; yy >= 2002; yy--) { var op = document.createElement('option'); op.textContent = yy; ysel.appendChild(op); }
  if (myCar) { $('m').value = myCar.m; $('y').value = myCar.y; if (myCar.vin) $('vin').value = myCar.vin; showCar('Ваш автомобиль'); }
  if (st.odo) { $('odo').value = fmt(st.odo); odoTyped(''); }
  if (S.tel) $('tel').value = S.tel;
}

/* Подбор запчастей из карточки */
var pendingParts = null;
function pickParts(b) {
  var box = b.parentNode, s = box.querySelector('.sellers'); s.hidden = false; b.hidden = true;
  var t = document.createElement('small'); t.style.cssText = 'display:block;color:var(--muted);margin-top:2px';
  t.textContent = myCar ? 'Подбор под ' + myCar.m + ' ' + myCar.y + (myCar.vin ? ', VIN ' + myCar.vin : '') : 'Автомобиль не указан — подбор по модели карточки. Укажите VIN для точного подбора';
  s.prepend(t);
  var cat = s.querySelector('a[data-catalog]'); if (cat && myCar && myCar.vin) cat.href = B+'/podbor/?vin=' + myCar.vin;
}
function toParts(a) {
  var box = a.closest('.box');
  var items = [].slice.call(box.querySelectorAll('.parts li, .sec-parts li')).map(function (li) { return li.textContent.replace(/\s+/g, ' ').trim(); });
  var h = document.querySelector('h1');
  pendingParts = 'Нужны запчасти' + (myCar ? ' для Volvo ' + myCar.m + ' ' + myCar.y + (myCar.vin ? ', VIN ' + myCar.vin : '') : '') + ':\n• ' + items.join('\n• ') + '\nКарточка: ' + (h ? h.textContent : '');
  try { sessionStorage.setItem('vm.pending', pendingParts); } catch (e) {}
}
function toSeller() { try { sessionStorage.setItem('vm.pending', 'Подбор по VIN' + (myCar && myCar.vin ? ' ' + myCar.vin : '') + (myCar ? ' для Volvo ' + myCar.m + ' ' + myCar.y : '')); } catch (e) {} }

/* Страница партнёра: сервис или поставщик (по режиму) */
if (page === 'partner') {
  var pend = null; try { pend = sessionStorage.getItem('vm.pending'); sessionStorage.removeItem('vm.pending'); } catch (e) {}
  var supplier = pend || /mode=parts/.test(location.search);
  var l = $('f-lbl'), t = $('f-txt');
  if (supplier) {
    $('p-eyebrow').innerHTML = 'Поставщик запчастей Volvo · <span class="c">' + (S.city || 'Москва') + '</span>';
    $('p-h1').textContent = 'Поставщик запчастей Volvo: подбор по VIN, оригинал и аналоги';
    $('p-lead').innerHTML = 'Подбор по VIN, оригинал и аналоги, счёт и доставка либо сделка через площадку. Ответ до 2 часов в рабочее время. Заявка передаётся поставщику, с которым у ООО «ЭРА» подписаны договорённости.';
    l.textContent = 'Нужны запчасти'; t.value = pend || ('Подбор по VIN' + (myCar && myCar.vin ? ' ' + myCar.vin : '') + (myCar ? ' для Volvo ' + myCar.m + ' ' + myCar.y : '')); t.rows = 6;
  } else if (myCar) { t.value = 'Volvo ' + myCar.m + ' ' + myCar.y + ': ' + (document.referrer ? 'карточка ' + document.referrer : ''); }
  document.querySelector('.form').addEventListener('submit', function (e) {
    e.preventDefault(); logRequest({ contact: $('f-contact').value, text: t.value, kind: supplier ? 'parts' : 'service' }); $('ok').classList.add('on');
  });
}

/* Раздел модели: фильтры по осям */
if (page === 'model') {
  document.querySelectorAll('.axes[data-axis]').forEach(function (ax) {
    ax.querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { ax.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); filterRows(); };
    });
  });
  function filterRows() {
    var g = document.querySelector('.axes[data-axis=gen] button.on'), s = document.querySelector('.axes[data-axis=sit] button.on');
    var gv = g ? g.dataset.v : '', sv = s ? s.dataset.v : '';
    var n = 0;
    document.querySelectorAll('.list .row[data-gen]').forEach(function (r) {
      var ok = (!gv || r.dataset.gen.split('|').indexOf(gv) >= 0 || r.dataset.gen === '*') && (!sv || r.dataset.sit === sv);
      r.hidden = !ok; if (ok) n++;
    });
    var e = $('empty'); if (e) e.hidden = n > 0;
  }
}

/* База заявок (журнал оператора — вход CRM-модуля Э3-6). На сайте без сервера — localStorage, демонстрация. */
function logRequest(r) {
  var list = []; try { list = JSON.parse(localStorage.getItem('vm.requests') || '[]'); } catch (e) {}
  r.id = list.length + 1; r.ts = new Date().toISOString(); r.vin = r.vin || st.vin || ''; r.car = myCar ? myCar.m + ' ' + myCar.y : ''; r.odo = st.odo || null;
  r.source = document.title; r.partner = 'поставщик-партнёр (по договорённости)'; r.status = 'new';
  list.push(r); try { localStorage.setItem('vm.requests', JSON.stringify(list)); } catch (e) {}
  console.log('request:', r); track(r.kind === 'service' ? 'service-request' : 'parts-request');
  return r;
}

/* ИИ-механик: частые вопросы + сценарий модель → VIN → пробег → симптомы → ответ → контакт */
var dr = $('drawer'), ms = $('msgs'); var step = 0, started = false;
var freq = { XC90: ['Стук в передней подвеске', 'Гул на 80–100 км/ч: ступичный подшипник', 'Nivomat или обычные амортизаторы', 'Ближайшее ТО', 'Расходники: масло, дворники, лампы'], XC60: ['«Срочно проверьте тормоза» на панели', 'Стук спереди на неровностях', 'Течь масла из-под клапанной крышки', 'Ближайшее ТО', 'Расходники: масло, дворники, лампы'], XC70: ['Когда менять ремень ГРМ на D5', 'Стук в передней подвеске', 'Гул ступичного подшипника', 'Ближайшее ТО', 'Расходники: масло, дворники, лампы'] };
function add(cls, html, opts) {
  var d = document.createElement('div'); d.className = 'msg ' + cls; d.innerHTML = html;
  if (opts) { var o = document.createElement('div'); o.className = 'opts'; opts.forEach(function (t) { var b = document.createElement('button'); b.textContent = t; b.onclick = function () { ask(t); }; o.appendChild(b); }); d.appendChild(o); }
  ms.appendChild(d); ms.scrollTop = ms.scrollHeight;
}
function placeChat() {
  if (!dr) return;
  if (page === 'home') { $('chat-home').appendChild(dr); dr.classList.add('inline'); dr.classList.remove('on'); }
}
function openChat() {
  if (!dr.classList.contains('inline')) dr.classList.add('on');
  if (!started) {
    started = true;
    if (myCar) { step = 3; add('a', 'Вижу: Volvo ' + myCar.m + ' ' + myCar.y + (st.odo ? ', пробег ' + fmt(st.odo) + ' км' : '') + '. Что беспокоит? Частые неисправности ' + myCar.m + ':', (freq[myCar.m] || freq.XC90).concat(['Другое'])); }
    else add('a', 'Какая у Вас Volvo? Модель и год — или VIN на главной.', ['XC90 2008', 'XC60 2012', 'XC70 2010']);
  }
}
function closeChat() { dr.classList.remove('on'); }
function setTab(t) {
  var p = t === 'parts';
  $('tab-ask').classList.toggle('on', !p); $('tab-parts').classList.toggle('on', p);
  $('pane-parts').hidden = !p; $('disc-parts').hidden = !p; $('disc-ask').hidden = p; $('msgs').hidden = p; document.querySelector('.ask').hidden = p;
  if (p) {
    var v = $('vin'), pv = $('p-vin'), pc = $('p-contact');
    if (v && v.value.length === 17) pv.value = v.value; else if (myCar && myCar.vin) pv.value = myCar.vin;
    var tel = $('tel'); if (tel && /\d{7,}/.test(tel.value) && !pc.value) pc.value = tel.value;
    if (pv.value) $('p-catalog').href = B+'/podbor/?vin=' + pv.value;
  }
}
function sendParts() {
  var c = $('p-contact').value.trim(); if (!/@|\+?\d{7,}/.test(c)) { $('p-contact').focus(); return; }
  var r = logRequest({ vin: $('p-vin').value, contact: c, text: $('p-what').value.trim(), kind: 'parts' });
  $('p-ok').textContent = 'Заявка № ' + r.id + ' сохранена в базе заявок и передана поставщику-партнёру. Ответ — до 2 рабочих часов.'; $('p-ok').classList.add('on');
}
function ask(t) {
  var inp = $('q'); t = t || inp.value.trim(); if (!t) return; inp.value = '';
  if (!started) { started = true; step = myCar ? 3 : 0; }
  add('u', t); setTimeout(function () { reply(t); }, 300);
}
function reply(t) {
  if (step === 0) {
    var mm = t.match(/XC90|XC60|XC70|S60|V70|S80|XC40|V60|S90/i);
    if (!mm) { st.pending = t; add('a', 'Какая у Вас Volvo? Модель и год — или VIN выше.', ['XC90 2008', 'XC60 2012', 'XC70 2010']); return; }
    var m = mm[0].toUpperCase(); st.m = m;
    if (st.pending) { step = 3; var q = st.pending; st.pending = null; add('a', 'Volvo ' + m + '. Смотрю по описанию: «' + q + '»'); reply(q); return; }
    step = 3; add('a', 'Volvo ' + m + '. Что беспокоит? Частые неисправности ' + m + ':', (freq[m] || freq.XC90).concat(['Другое'])); return;
  }
  if (step === 1) { if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(t)) { st.vin = t.toUpperCase(); add('a', 'VIN принят: ' + st.m + ' I, 2.5T, 2008 (образец распознавания).'); } step = 2; add('a', 'Какой пробег сейчас, примерно? С него начну считать ТО и напомню заранее.', ['187 000', 'Не знаю']); return; }
  if (step === 2) { var o = parseInt(t.replace(/\D/g, ''), 10) || st.odo; if (o) { st.odo = o; S.odo = o; save(); add('a', 'Записал ' + fmt(o) + ' км. Следующее ТО — ' + fmt(nextTO(o)) + ' км, через ' + fmt(nextTO(o) - o) + ' км (ориентир; точный интервал — по VIN).'); } step = 3; add('a', 'Что беспокоит? Частые проблемы ' + st.m + ':', (freq[st.m] || freq.XC90).concat(['Другое'])); return; }
  if (step === 3) {
    step = 4; var M = st.m || 'Volvo';
    var src = function (link) { return '<span class="src">Эксперт ответа: ' + EXPERT + ' · Источник: ' + link + '</span>'; };
    if (/масл|дворник|щётк|лампа|лампоч|расходник|антифриз|омыва|жидкост/i.test(t)) add('a', 'Расходники для Volvo ' + M + ': масло 0W-30 Volvo/Castrol A5/B5 (у Drive-E — 0W-20 VCC RBS0-2AE), дворники 26″/20″ (XC90 I), лампы H7/H11, антифриз Volvo VCS (жёлто-зелёный, не смешивать с G12). Полный список по узлам и ресурсу — в карточке.' + src('<a href="'+B+'/cons/">Расходники для эксплуатации Volvo ' + M + '</a>'));
    else if (/(^|[^а-яё])то([^а-яё]|$)|обслуж|регламент/i.test(t)) { var oo = st.odo || 0; add('a', (oo ? 'Ближайшее ТО для Volvo ' + M + ' — <b>' + fmt(nextTO(oo)) + ' км</b> (через ' + fmt(nextTO(oo) - oo) + ' км) или через 12 месяцев после прошлого, что раньше. ' : 'Укажите пробег на главной — посчитаю ближайшее ТО. ') + 'Состав работ по пробегу и году — в карточке.' + src('<a href="'+B+'/to/">Ближайшее ТО: что менять по пробегу и году</a>')); }
    else if (/сту[кч]|подвеск|кочк|неровност/i.test(t)) add('a', 'По картотеке: глухой стук спереди на мелких неровностях у ' + M + ' чаще всего — стойки стабилизатора или шаровые опоры; проверка 10 минут на подъёмнике. Причины по частоте, что проверить самому и цены — в карточке.' + src(cardLink('стук|стойк|шаров|сайлентблок', 'карточка по подвеске')) + '<br><b>Если стук при торможении или увод руля — к мастеру сегодня.</b>');
    else if (/гул|подшипник/i.test(t)) add('a', 'По картотеке: ровный гул с 60–80 км/ч, меняющийся в повороте, — ступичный подшипник; ресурс 100–150 тыс. км, замена ступицей в сборе 1–1,5 ч.' + src(cardLink('гул|ступи|подшипник', 'карточка по ступичному подшипнику')));
    else if (/nivomat|аморт/i.test(t)) add('a', 'По картотеке: Nivomat — самоподкачивающиеся задние амортизаторы XC90 I; замена на обычные — только парой с пружинами.' + src(cardLink('амортизатор|nivomat', 'карточка по амортизаторам')));
    else if (/грм|ремень/i.test(t)) add('a', 'Карточки по ремню ГРМ D5 в картотеке пока нет — <b>тема в плане публикаций</b>, вопрос передан эксперту.' + src(cardLink('грм|ремень', 'раздел модели')));
    else if (/тормоз|колодк/i.test(t)) add('a', 'По картотеке: сообщение о тормозах у XC60 I чаще всего — низкий уровень тормозной жидкости из-за износа колодок.<br><b>Это тормоза: заключение даёт только мастер; мягкая педаль — эвакуатор.</b>' + src(cardLink('тормоз|колодк', 'карточка по тормозам')));
    else if (/лампа|фар|свет/i.test(t)) add('a', 'По картотеке: лампы и регулировка фар — частая причина отказа на техосмотре; типы ламп и порядок замены — в карточке.' + src(cardLink('лампа|фар', 'карточка по освещению')));
    else if (/пружин/i.test(t)) add('a', 'По картотеке: пружины — первый единичный отказ XC60 I и XC70 II по данным техосмотра; признаки и что проверить — в карточке.' + src(cardLink('пружин', 'карточка по пружинам')));
    else add('a', '<b>В картотеке такая проблема не описана.</b> Тема уйдёт в план публикаций, вопрос передан эксперту ' + EXPERT + ' — ответ в рабочее время, если оставите контакт.');
    add('a', 'Нужны запчасти' + (st.vin ? ' под VIN ' + st.vin : '') + ' или запись в сервис?' + (st.vin ? '' : ' Для точного подбора напишите VIN (17 знаков, в СТС) вместе с контактом.') + ' Оставьте телефон или Telegram — партнёр ответит до 2 часов в рабочее время. Оператор данных — ООО «ЭРА»; контакт передаётся поставщику или сервису-партнёру для ответа.', ['Нужны запчасти', 'Записаться в сервис', 'Не нужно']);
    return;
  }
  if (step === 4) {
    if (/не нужно/i.test(t)) { add('a', 'Хорошо. Спрашивайте, если что — я здесь.'); step = 3; return; }
    if (/серви/i.test(t)) { add('a', '<a href="'+B+'/partner/">Записаться в сервис-партнёр</a> — форма уйдёт сервису напрямую.'); return; }
    if (/запчаст/i.test(t)) { add('a', 'Откройте вкладку «Подобрать запчасть по VIN» выше или <a href="'+B+'/podbor/' + (st.vin ? '?vin=' + st.vin : '') + '">подберите по каталогу</a>; для заявки поставщику оставьте телефон или @telegram.'); return; }
    if (/@|\+?\d{7,}/.test(t)) { var v = t.match(/[A-HJ-NPR-Z0-9]{17}/i); if (v) st.vin = v[0].toUpperCase(); st.contact = t; logRequest({ contact: t, text: 'из ИИ-механика', kind: 'parts' }); add('a', 'Принято. Заявка' + (st.vin ? ' с VIN ' + st.vin : '') + (st.odo ? ', пробег ' + fmt(st.odo) + ' км' : '') + ' ушла поставщику-партнёру; ответ до 2 часов в рабочее время. Оплата и доставка — по договорённости с поставщиком.'); step = 3; return; }
    add('a', 'Напишите телефон или @telegram — передам партнёру.'); return;
  }
}
var EXPERT = (document.body.dataset.expert || 'эксперт картотеки');
if ($('q')) $('q').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } });
placeChat();
if (page === 'home') { applyFaq(); if (myCar) openChat(); else $('faq-box').hidden = true; }

/* Карточки из данных: «Ближайшее ТО» и «Расходники» — считаются по машине и пробегу (макет 0.53, VM-0040/0041 [О]) */
function toCard() {
  var m = myCar ? myCar.m : 'XC90', y = myCar ? parseInt(myCar.y, 10) : null, o = st.odo || null, age = y ? 2026 - y : null;
  var next = o ? nextTO(o) : null, k = next ? next / 15000 : null;
  var base = ['Масло моторное 0W-30 A5/B5, 6,5–7 л', 'Фильтр масляный', 'Фильтр воздушный', 'Фильтр салона', 'Осмотр подвески, тормозов, течей; диагностика VIDA'];
  var extra = [];
  if (k && k % 2 === 0) extra.push('Тормозная жидкость — каждые 2 года или 30 000 км');
  if (k && k % 4 === 0) extra.push('Свечи зажигания (бензин) — 60 000 км; топливный фильтр (дизель)');
  if (k && k % 6 === 0) extra.push('Масло АКПП — 90 000 км (ориентир; Volvo заявляет «на весь срок»)');
  if (next && next >= 180000 && next % 180000 < 15000) extra.push('Ремень ГРМ с роликами и помпой (D5, бензин 5-цил.) — 180 000 км или 10 лет');
  if (age && age >= 10) extra.push('По возрасту ' + age + ' лет: ремень ГРМ, если не менялся 10 лет; охлаждающая жидкость; тормозные шланги — осмотр');
  var ans = next ? 'Ближайшее ТО для Volvo ' + m + (y ? ' ' + y : '') + ' при пробеге ' + fmt(o) + ' км — на <b>' + fmt(next) + ' км</b>, через ' + fmt(next - o) + ' км или 12 месяцев после прошлого, что наступит раньше. Базовый состав — масло и три фильтра, 8–14 тыс. ₽ с работой; на этом пробеге добавляется: ' + (extra.length ? extra.map(function (x) { return x.split(' — ')[0].toLowerCase(); }).join(', ') : 'ничего сверх базового') + '.' : 'Укажите пробег и год на главной — карточка посчитает ближайшее ТО. Регламент Volvo: каждые 15 000 км или 12 месяцев; состав работ меняется на 30, 60, 90 и 180 тыс. км и после 10 лет.';
  return { id: 'VM-0040', doc: true, crumb: (myCar ? '<a href="'+B+'/models/' + m.toLowerCase() + '/">' + m + '</a>' : 'Общие') + ' › ТО', title: 'Ближайшее ТО Volvo ' + m + (y ? ' ' + y + ' г.' : '') + ': что менять на ' + (next ? fmt(next) + ' км' : 'ближайшем пробеге') + ' — регламент по пробегу и году',
    ans: ans, fit: m + (y ? ', ' + y + ' г.' : '') + '; интервал 15 000 км / 12 мес — ориентир для большинства моделей и двигателей, точный — по VIN',
    signs: ['Подошёл пробег или год с прошлого ТО', 'Сообщение на панели «Время обслуживания»'],
    causes: base.concat(extra.map(function (x) { return '<b>' + x + '</b>'; })), self: ['Проверить уровень масла и охлаждающей жидкости', 'Найти дату и пробег прошлого ТО по сервисной книжке или наклейке под капотом'],
    safety: 'Тормозная жидкость и тормозные шланги старше 4 лет — только к специалисту.',
    faq: [['Можно ли ездить дольше 15 000 км между ТО?', 'Volvo допускает до 20 000 км на некоторых рынках с маслом A5/B5; в российских условиях мастера советуют 10–15 тыс.'], ['Что обязательно по году, а не по пробегу?', 'Масло и тормозная жидкость стареют по времени: 12 и 24 месяца независимо от пробега.']],
    parts: [['Масло 0W-30 A5/B5, 7 л', '5 200–7 800 ₽'], ['Фильтры: масляный, воздушный, салонный', '2 200–5 400 ₽']].concat(extra.some(function (x) { return /ГРМ/.test(x); }) ? [['Комплект ГРМ с помпой (D5)', '12 000–25 000 ₽']] : []), checked: '30.10.2026', until: '30.04.2027', causesTitle: 'Состав работ на ближайшем ТО' };
}
function consCard() {
  var m = myCar ? myCar.m : 'XC90', y = myCar ? myCar.y : null; var de = /XC40|S90|V60|XC60/.test(m) && y && parseInt(y, 10) >= 2015;
  return { id: 'VM-0041', doc: true, crumb: (myCar ? '<a href="'+B+'/models/' + m.toLowerCase() + '/">' + m + '</a>' : 'Общие') + ' › Расходники', title: 'Расходники для эксплуатации Volvo ' + m + (y ? ' ' + y + ' г.' : '') + ': масло, фильтры, дворники, лампы, жидкости — что подходит и сколько ходит',
    ans: 'Для Volvo ' + m + (y ? ' ' + y : '') + ': моторное масло ' + (de ? '0W-20 по спецификации Volvo VCC RBS0-2AE (Drive-E)' : '0W-30 или 5W-30 ACEA A5/B5 (Volvo, Castrol Edge Professional)') + ', 6,5–7 л с фильтром; антифриз только Volvo VCS (жёлто-зелёный, не смешивать с G12/G13); тормозная жидкость DOT 4; дворники ' + (/XC90/.test(m) ? '26″ и 20″ (XC90 I), 24″ и 20″ (XC90 II)' : 'по VIN') + ', крючок или штык; лампы ближнего ' + (/XC90|XC70|S80/.test(m) ? 'H7 (галоген) или D2R (ксенон)' : 'H7 / LED по комплектации') + '. Полный комплект на год — 12–20 тыс. ₽ в ценах Москвы, ноябрь 2026.',
    fit: m + (y ? ', ' + y + ' г.' : '') + '; тип лампы, дворников и масла зависит от комплектации и двигателя — проверяется по VIN',
    signs: ['Масло — каждые 15 000 км или 12 мес', 'Дворники — раз в год, перед зимой', 'Антифриз — 5 лет или 150 000 км (VCS)', 'Тормозная жидкость — 2 года', 'Лампы — по факту; ксенон D2R — парой'],
    causes: ['Масло моторное ' + (de ? '0W-20 VCC RBS0-2AE, 5,5 л' : '0W-30 A5/B5, 7 л') + ' — 5 200–7 800 ₽', 'Фильтр масляный (Mann, Mahle, Volvo) — 600–1 400 ₽', 'Фильтр воздушный — 900–2 100 ₽; салонный угольный — 700–1 900 ₽', 'Дворники бескаркасные (Bosch Aerotwin, Volvo) — 2 500–4 500 ₽ пара', 'Лампы H7 (Osram, Philips) — 600–1 500 ₽ пара; D2R ксенон — 4 000–9 000 ₽ пара', 'Антифриз Volvo VCS концентрат 4 л — 2 500–3 500 ₽', 'Жидкость омывателя зимняя −25 °C — 300–600 ₽', 'Щётки стеклоочистителя заднего стекла (XC90, XC70, V70) — 700–1 200 ₽'],
    self: ['Сверить допуск масла на крышке маслозаливной горловины или в руководстве', 'Проверить тип крепления дворников и длину по VIN', 'Доливать антифриз только VCS: другой цвет — повод к сервису'],
    safety: 'Тормозная жидкость, лампы фар при неработающем корректоре и ксенон — замена у специалиста.',
    faq: [['Какое масло лить в Volvo XC90 I?', '0W-30 или 5W-30 ACEA A5/B5; 5W-40 — не для этих моторов (ресурс гидрокомпенсаторов).'], ['Можно ли залить обычный антифриз G12?', 'Нет: Volvo VCS несовместим с G12/G13, смесь даёт осадок в радиаторе печки.'], ['Какие дворники на XC90 I?', '26″ водительский и 20″ пассажирский, крепление крючок; на XC90 II — 24″/20″, штык.'], ['Какой ресурс у ламп H7?', 'Стандартные — 500–700 ч; «+150 %» — 150–250 ч, ярче, но меняются парой каждый год.']],
    parts: [['Комплект ТО: масло 7 л + 3 фильтра', '8 000–14 000 ₽'], ['Дворники пара', '2 500–4 500 ₽'], ['Лампы H7 пара', '600–1 500 ₽'], ['Антифриз VCS 4 л', '2 500–3 500 ₽']], checked: '30.10.2026', until: '30.04.2027', causesTitle: 'Что покупать: позиции, бренды, ориентир цен', signsTitle: 'Периодичность замены' };
}
function renderGen(k) {
  var el = $('gen'); if (!el) return;
  var c = k === 'to' ? toCard() : consCard(); var city = S.city || 'Москва';
  var li = function (a) { return a.map(function (x) { return '<li>' + x + '</li>'; }).join(''); };
  var partners = window.DEMO_PARTNERS || [];
  el.innerHTML = '<p class="crumbs"><a href="'+B+'/">Главная</a> › ' + c.crumb + '</p><div class="card"><article>' +
    '<p class="eyebrow">Карточка · ' + c.id + ' · из данных</p><p style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 0"><span class="pill warn">оценка редакции [О], требует подтверждения экспертом</span>' + (c.doc ? '<span class="pill doc">документация Volvo Cars</span>' : '') + '</p>' +
    '<h1>' + c.title + '</h1><div class="answer">' + c.ans + '</div><p class="fit"><b>Для каких исполнений:</b> ' + c.fit + '</p><div class="sec">' +
    '<h3>' + (c.signsTitle || (c.causesTitle ? 'Когда пора' : 'Признаки')) + '</h3><ul>' + li(c.signs) + '</ul>' +
    '<h3>' + (c.causesTitle || 'Причины по частоте') + '</h3><ul>' + li(c.causes) + '</ul>' +
    '<h3>Что проверить самому</h3><ul>' + li(c.self) + '</ul><h3>Когда ехать к специалисту</h3><div class="safety">' + c.safety + '</div>' +
    (c.faq.length ? '<h3>Вопросы и ответы</h3><div class="faq">' + c.faq.map(function (q) { return '<details><summary>' + q[0] + '</summary><p>' + q[1] + '</p></details>'; }).join('') + '</div>' : '') + '</div>' +
    '<div class="meta"><span>Составлено: ' + c.checked + ' · пересмотр до ' + c.until + '</span><span>Автор: редакция ЭРА-Вольвоман · Подтверждение экспертом — ожидается</span><span>Источники: ' + (c.doc ? '<a href="https://www.volvocars.com/ru/support/" target="_blank" rel="noopener">документация Volvo Cars (руководства владельца)</a>; ' : '') + 'регламент ТО Volvo; ориентиры цен Москвы, ноябрь 2026 [О]</span><span>Материал информационный и не заменяет диагностику у специалиста. Текст подготовлен с помощью ИИ; ответственность за рекомендации — оператор сайта и эксперт, указанный в ответе</span></div></article>' +
    '<aside>' + (partners.length ? '<div class="box" data-nosnippet><h4>Кто починит в <span class="c">' + city + '</span></h4>' + partners.map(function (p, i) { return '<div class="partner"><b>' + p.name + '</b><small>' + p.note + '</small><a class="btn' + (i ? ' ghost' : '') + '" href="'+B+'/partner/">Записаться</a></div>'; }).join('') + '</div>' : '') +
    '<div class="box" data-nosnippet><h4>Подобрать запчасти</h4><ul class="parts">' + c.parts.map(function (x) { return '<li>' + x[0] + '<small>' + x[1] + '</small></li>'; }).join('') + '</ul><small style="color:var(--muted)">Ориентир цен, ' + city + ', ноябрь 2026 [О]; артикулы — по VIN</small><button class="btn ghost" style="margin-top:8px" onclick="pickParts(this)">Подобрать под мой автомобиль</button><div class="sellers" hidden>' + (window.SUPPLIER_URL ? '<a href="' + window.SUPPLIER_URL + '" target="_blank" rel="noopener nofollow" onclick="track(\'avito\')"><span>Поставщик-партнёр на Авито: в наличии, доставка</span><small>переход ↗</small></a>' : '') + '<a href="'+B+'/podbor/" data-catalog><span>Подобрать по каталогу: артикул и название</span><small>на сайте</small></a><a href="'+B+'/partner/?mode=parts" onclick="toParts(this)"><span>Заявка поставщику: подбор по VIN, счёт, доставка</span><small>ответ до 2 ч</small></a><small style="color:var(--muted)">Переход учтён в статистике карточки</small></div></div>' +
    (window.EXPERT_BOX || '') + '</aside></div>';
  setCity(city);
}
if (page === 'to') renderGen('to');
if (page === 'cons') renderGen('cons');
