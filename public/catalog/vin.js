/* Декодер VIN Volvo → поколение каталога. Только модель и модельный год;
   двигатель и номер шасси не используются. Таблица кодов — [О], по открытым
   источникам, подлежит проверке по реальным VIN. */
(function (global) {
  // позиции 4–5 VIN → имя поколения в каталоге; функция — когда код делится по годам
  var MODEL = {
    LS: function (y) { return y < 1997 ? '850' : 'S70'; },
    LW: function (y) { return y < 1997 ? '850' : 'V70 LW'; },
    LZ: 'V70 XC LW',
    KS: function (y) { return y < 1997 ? '960' : 'S90 KS'; },
    KW: function (y) { return y < 1997 ? '960' : 'V90 KW'; },
    VS: 'S40 V', VW: 'V40 V',
    NC: 'C70 NC/NK Coupe', NK: 'C70 NC/NK Convertible',
    TS: 'S80 TS', RS: 'S60 P24', SW: 'V70 P26', SZ: 'V70 XC P26',
    CZ: 'XC90', CM: 'XC90', CY: 'XC90',
    MS: 'S40 M', MW: 'V50 M', MK: 'C30 M', MC: 'C70 M Coupe',
    AS: 'S80 AS', AR: 'S80 AS L',
    BZ: 'XC70 P24', BW: 'V70 24',
    DZ: 'XC60 Y20',
    FS: 'S60 Y20', FW: 'V60 Y20', FZ: 'V60 Y20 Cross Country',
    MV: 'V40 P1', MZ: 'V40 P1 Cross Country'
  };
  var YEAR = 'ABCDEFGHJKLMNPRSTVWXY123456789';

  function modelYear(ch, lo, hi) {
    var i = YEAR.indexOf(ch);
    if (i < 0) return null;
    var cands = i < 21 ? [1980 + i, 2010 + i] : [2001 + (i - 21)];
    for (var k = 0; k < cands.length; k++) if (cands[k] >= lo && cands[k] <= hi) return cands[k];
    return cands[0];
  }

  /* gens — массив {name, y1, y2} из index.json.
     Возвращает {gen, year} | {error} */
  function decode(vin, gens) {
    vin = (vin || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (vin.length !== 17) return { error: 'VIN состоит из 17 знаков' };
    if (/[IOQ]/.test(vin)) return { error: 'В VIN не бывает букв I, O, Q' };
    if (vin.slice(0, 2) !== 'YV') return { error: 'Это не VIN Volvo (начинается не с YV)' };
    var code = vin.slice(3, 5), yc = vin.charAt(9);
    var m = MODEL[code];
    if (!m) return { error: 'Код модели «' + code + '» в таблице нет — выберите модель и год вручную' };
    var yr = modelYear(yc, 1975, 2030);
    if (yr === null) return { error: 'Знак года «' + yc + '» не распознан' };
    var name = typeof m === 'function' ? m(yr) : m;
    var g = null;
    for (var i = 0; i < gens.length; i++) if (gens[i].name === name) { g = gens[i]; break; }
    if (!g) return { error: 'Поколение «' + name + '» в каталоге отсутствует' };
    var y2 = modelYear(yc, g.y1, g.y2);
    return { gen: g, year: y2, inRange: y2 >= g.y1 && y2 <= g.y2 };
  }
  global.VolvoVIN = { decode: decode, MODEL: MODEL };
})(typeof window !== 'undefined' ? window : globalThis);
