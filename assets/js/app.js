/* ==========================================================================
   ЯДРО МАГАЗИНА
   Общие вещи для всех страниц: форматирование, иконки, корзина и избранное
   (localStorage), шапка и подвал из config.js, выезжающие панели (корзина,
   меню, поиск), карточка товара, ленты, анимации появления.
   Обычные скрипты без модулей — сайт работает даже при открытии файла с диска.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.SHOP_CONFIG;
  var D = window.SHOP_DATA;
  var doc = document;

  /* ---------- Утилиты ---------- */
  function $(sel, root) { return (root || doc).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var nf = new Intl.NumberFormat(C.locale);
  function fmt(n) { return nf.format(Math.round(n)) + ' ' + C.currency; }
  function plural(n, forms) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }
  // Неразрывные пробелы после коротких слов и между числом и единицей — чтобы «шт.» и «в» не висели
  function typo(s) {
    var short = /(^|[\s«(\u00A0])(в|к|с|у|о|и|я|а|во|на|не|по|из|за|до|от|об|со|ко|ни|но|для|без|при|под|над|про)\s/gi;
    return String(s == null ? '' : s).replace(short, '$1$2\u00A0').replace(short, '$1$2\u00A0')
      .replace(/(\d)\s(?=(?:шт|мл|см|мм|кг|г|л|ч|предм|дней|дня|день|недел)(?![а-яё]))/gi, '$1\u00A0')
      .replace(/\s(—|–)\s/g, '\u00A0$1 ');
  }
  function norm(s) { return String(s).toLowerCase().replace(/ё/g, 'е'); }
  function params() { return new URLSearchParams(location.search); }
  function debounce(fn, ms) { var t; return function () { var a = arguments, ctx = this; clearTimeout(t); t = setTimeout(function () { fn.apply(ctx, a); }, ms); }; }
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Справочники ---------- */
  var byId = {}, catById = {}, makerById = {};
  D.products.forEach(function (p) { byId[p.id] = p; });
  D.categories.forEach(function (c) { catById[c.id] = c; });
  D.makers.forEach(function (m) { makerById[m.id] = m; });
  function catCount(id) { return D.products.filter(function (p) { return p.cat === id; }).length; }

  function img(p, kind) {
    var suffix = { main: '', sm: '-sm', detail: '-detail', full: '-full' }[kind || 'main'];
    return C.productImagePath + p.id + suffix + '.webp';
  }
  function productUrl(p) { return 'product.html?id=' + encodeURIComponent(p.id); }

  /* ---------- Иконки (линейные, 24×24, обводка 1.5) ---------- */
  var P = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    heart: '<path d="M12 20.2 4.9 13.3A4.6 4.6 0 0 1 12 6.9a4.6 4.6 0 0 1 7.1 6.4Z"/>',
    bag: '<path d="M5.5 8h13l-1 12.5h-11Z"/><path d="M9 8V6.8a3 3 0 0 1 6 0V8"/>',
    menu: '<path d="M3.5 9h17M3.5 15h17"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    chevDown: '<path d="m6 9 6 6 6-6"/>',
    chevLeft: '<path d="m15 6-6 6 6 6"/>',
    chevRight: '<path d="m9 6 6 6-6 6"/>',
    arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    arrowLeft: '<path d="M20 12H4M10 6l-6 6 6 6"/>',
    arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    truck: '<path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.2v3.3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    box: '<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4Z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/>',
    mail: '<path d="M3.5 6h17v12h-17z"/><path d="m3.5 6.5 8.5 7 8.5-7"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
    returnIcon: '<path d="M4 10h11a5 5 0 0 1 0 10h-3"/><path d="m8 6-4 4 4 4"/>',
    leaf: '<path d="M5 19c0-8 5-13.5 14.5-14 .5 9.5-5 14.5-13 14.5"/><path d="M5 19c3-4 6-6.5 9.5-8.5"/>',
    shield: '<path d="M12 3.5 19 6v5.5c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    grid2: '<path d="M4 4h7v16H4zM13 4h7v16h-7z"/>',
    grid3: '<path d="M3.5 4h4.5v16H3.5zM9.75 4h4.5v16h-4.5zM16 4h4.5v16H16z"/>',
    grid4: '<path d="M3 4h3.4v16H3zM8.2 4h3.4v16H8.2zM13.4 4h3.4v16h-3.4zM18.6 4H22v16h-3.4z"/>',
    phone: '<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="1"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    gift: '<path d="M4 9.5h16v4H4zM5.5 13.5h13v7h-13zM12 9.5v11"/><path d="M12 9.5c-1.5-3.5-5.5-4-5.5-1.5S12 9.5 12 9.5Zm0 0c1.5-3.5 5.5-4 5.5-1.5S12 9.5 12 9.5Z"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
    zoom: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5M11 8.5v5M8.5 11h5"/>',
    star: '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z"/>'
  };
  function icon(name, cls) {
    var filled = name === 'star';
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') +
      '" stroke="currentColor" stroke-width="' + (filled ? '0' : '1.5') + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + P[name] + '</svg>';
  }
  var logoMark = '<svg class="logo__mark" viewBox="0 0 26 26" aria-hidden="true" focusable="false"><path fill="currentColor" d="M1.5 10.5h23c0 6.1-4.9 10.6-11.5 10.6S1.5 16.6 1.5 10.5Z"/><path d="M9 23.8h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function stars(r) {
    var out = '<span class="stars" aria-hidden="true">';
    for (var i = 1; i <= 5; i++) out += icon('star', i <= Math.round(r) ? '' : 'is-empty');
    return out + '</span>';
  }

  /* ---------- Хранилище ---------- */
  var KEY = C.storageKey || 'shop';
  var storage = {
    get: function (k, fb) { try { var v = localStorage.getItem(KEY + ':' + k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set: function (k, v) { try { localStorage.setItem(KEY + ':' + k, JSON.stringify(v)); } catch (e) { /* приватный режим */ } }
  };
  function emit(name, detail) { doc.dispatchEvent(new CustomEvent(name, { detail: detail })); }

  /* ---------- Цена с учётом варианта ---------- */
  function optionDelta(p, optIndex) {
    if (!p.option || optIndex == null) return 0;
    var v = p.option.values[optIndex];
    return v ? v.d : 0;
  }
  function unitPrice(p, optIndex) { return p.price + optionDelta(p, optIndex); }
  function unitOld(p, optIndex) { return p.old ? p.old + optionDelta(p, optIndex) : null; }
  function discountPct(p) { return p.old ? Math.round((1 - p.price / p.old) * 100) : 0; }
  function priceHTML(p, optIndex) {
    var old = unitOld(p, optIndex);
    return '<span class="price' + (old ? ' price--sale' : '') + '"><span class="price__now">' + fmt(unitPrice(p, optIndex)) + '</span>' +
      (old ? '<s class="price__old"><span class="visually-hidden">Старая цена: </span>' + fmt(old) + '</s>' : '') + '</span>';
  }

  /* ---------- Корзина ---------- */
  var Cart = {
    items: storage.get('cart', []).filter(function (i) { return byId[i.id]; }),
    save: function () { storage.set('cart', this.items); emit('cart:change', this); },
    key: function (id, color, opt) { return [id, color == null ? '' : color, opt == null ? '' : opt].join('|'); },
    add: function (id, o) {
      o = o || {};
      var p = byId[id]; if (!p || p.stock <= 0) return false;
      var color = o.color != null ? o.color : (p.colors && p.colors.length ? 0 : null);
      var opt = o.option != null ? o.option : (p.option ? 0 : null);
      var k = this.key(id, color, opt);
      var line = this.items.filter(function (i) { return i.key === k; })[0];
      var qty = o.qty || 1;
      if (line) line.qty = Math.min(line.qty + qty, p.stock);
      else this.items.push({ key: k, id: id, color: color, option: opt, qty: Math.min(qty, p.stock) });
      this.save();
      return true;
    },
    setQty: function (k, q) {
      var line = this.items.filter(function (i) { return i.key === k; })[0];
      if (!line) return;
      if (q <= 0) return this.remove(k);
      line.qty = Math.min(q, byId[line.id].stock);
      this.save();
    },
    remove: function (k) { this.items = this.items.filter(function (i) { return i.key !== k; }); this.save(); },
    clear: function () { this.items = []; this.save(); },
    count: function () { return this.items.reduce(function (s, i) { return s + i.qty; }, 0); },
    lines: function () {
      return this.items.map(function (i) {
        var p = byId[i.id];
        var variant = [];
        if (i.color != null && p.colors[i.color] && p.colors[i.color].n) variant.push(p.colors[i.color].n);
        if (i.option != null && p.option) variant.push(p.option.values[i.option].n);
        return { key: i.key, p: p, qty: i.qty, color: i.color, option: i.option, variant: variant.join(' · '),
          unit: unitPrice(p, i.option), old: unitOld(p, i.option), total: unitPrice(p, i.option) * i.qty };
      });
    },
    subtotal: function () { return this.lines().reduce(function (s, l) { return s + l.total; }, 0); },
    savings: function () { return this.lines().reduce(function (s, l) { return s + (l.old ? (l.old - l.unit) * l.qty : 0); }, 0); }
  };

  var Favs = {
    ids: storage.get('favs', []).filter(function (id) { return byId[id]; }),
    has: function (id) { return this.ids.indexOf(id) > -1; },
    toggle: function (id) {
      var on = !this.has(id);
      this.ids = on ? [id].concat(this.ids) : this.ids.filter(function (x) { return x !== id; });
      storage.set('favs', this.ids); emit('fav:change', { id: id, on: on });
      return on;
    }
  };

  var Recent = {
    ids: function () { return storage.get('recent', []).filter(function (id) { return byId[id]; }); },
    push: function (id) { var l = this.ids().filter(function (x) { return x !== id; }); l.unshift(id); storage.set('recent', l.slice(0, 12)); }
  };

  /* ---------- Карточка товара ---------- */
  function tagsHTML(p) {
    var t = [];
    if (p.stock <= 0) t.push('<span class="tag">Нет в наличии</span>');
    if (p.badges.indexOf('new') > -1) t.push('<span class="tag tag--new">Новинка</span>');
    if (p.badges.indexOf('sale') > -1 && p.old) t.push('<span class="tag tag--sale">−' + discountPct(p) + '%</span>');
    if (p.badges.indexOf('hit') > -1) t.push('<span class="tag">Хит</span>');
    if (p.stock > 0 && p.stock <= 3) t.push('<span class="tag tag--last">' + (p.stock === 1 ? 'Последний' : 'Осталось ' + p.stock) + '</span>');
    return t.join('');
  }
  function card(p, o) {
    o = o || {};
    var m = makerById[p.maker];
    var fav = Favs.has(p.id);
    var sw = (p.colors || []).filter(function (c) { return c.h; });
    var swHTML = sw.length > 1 ? '<ul class="swatches" aria-label="' + sw.length + ' ' + plural(sw.length, ['цвет', 'цвета', 'цветов']) + '">' +
      sw.slice(0, 4).map(function (c) { return '<li style="background:' + esc(c.h) + '" title="' + esc(c.n) + '"></li>'; }).join('') +
      (sw.length > 4 ? '<li class="swatches__more">+' + (sw.length - 4) + '</li>' : '') + '</ul>' : '';
    var loading = o.eager ? 'eager' : 'lazy';
    var sizes = o.sizes || '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw';
    return '<article class="card' + (p.stock <= 0 ? ' is-soldout' : '') + (o.reveal ? ' reveal' : '') + '" data-id="' + p.id + '"' + (o.i != null ? ' style="--i:' + o.i + '"' : '') + '>' +
      '<div class="card__media">' +
        '<a class="card__link" href="' + productUrl(p) + '" tabindex="-1" aria-hidden="true">' +
          '<img class="card__img" src="' + img(p, 'sm') + '" srcset="' + img(p, 'sm') + ' 520w, ' + img(p) + ' 1000w" sizes="' + sizes + '" alt="" width="520" height="650" loading="' + loading + '" decoding="async">' +
          '<img class="card__img card__img--alt" src="' + img(p, 'detail') + '" alt="" width="800" height="1000" loading="lazy" decoding="async">' +
        '</a>' +
        '<div class="card__tags">' + tagsHTML(p) + '</div>' +
        '<button class="card__fav" type="button" data-fav="' + p.id + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Убрать из избранного' : 'В избранное') + ': ' + esc(p.title) + '">' + icon('heart') + '</button>' +
        (p.stock > 0 ? '<button class="card__quick" type="button" data-add="' + p.id + '" aria-label="Добавить в корзину: ' + esc(p.title) + '"><span>В корзину</span>' + icon('plus') + '</button>' : '') +
      '</div>' +
      '<div class="card__body">' +
        '<p class="card__maker">' + esc(m.name) + ' · ' + esc(m.city) + '</p>' +
        '<h3 class="card__title"><a href="' + productUrl(p) + '">' + esc(typo(p.title)) + '</a></h3>' +
        '<div class="card__meta">' + priceHTML(p) + swHTML + '</div>' +
      '</div>' +
    '</article>';
  }

  /* ---------- Шапка ---------- */
  function renderHeader() {
    var host = $('[data-site-header]'); if (!host) return;
    var page = doc.body.getAttribute('data-page');
    var cats = D.categories.map(function (c) {
      return '<li><a href="catalog.html?cat=' + c.id + '" data-preview="' + c.cover + '">' + esc(c.name) + '<sup>' + catCount(c.id) + '</sup></a></li>';
    }).join('');
    var navLinks = C.nav.map(function (n) {
      var cur = (page === 'about' && n.href.indexOf('about') === 0) || (page === 'delivery' && n.href.indexOf('delivery') === 0);
      return '<a class="nav-link" href="' + n.href + '"' + (cur ? ' aria-current="page"' : '') + '>' + esc(n.label) + '</a>';
    }).join('');
    var firstCover = byId[D.categories[0].cover];
    host.outerHTML =
      '<a class="skip-link" href="#main">Перейти к содержимому</a>' +
      '<div class="promo"><div class="container promo__inner"><p class="promo__text">' + C.promo + '</p>' +
        '<div class="promo__aside"><span>' + esc(C.contacts.hours) + '</span><a href="tel:' + C.contacts.phoneHref + '">' + esc(C.contacts.phone) + '</a></div></div></div>' +
      '<header class="header" data-header>' +
        '<div class="container header__inner">' +
          '<div class="header__left">' +
            '<button class="icon-btn header__burger" type="button" data-open="menu" aria-label="Открыть меню" aria-controls="drawer-menu">' + icon('menu') + '</button>' +
            '<nav class="header__nav" aria-label="Основное меню">' +
              '<button class="nav-link" type="button" data-mega-toggle aria-expanded="false" aria-controls="mega"' + (page === 'catalog' ? ' aria-current="page"' : '') + '>Каталог' + icon('chevDown') + '</button>' +
              navLinks +
            '</nav>' +
          '</div>' +
          '<a class="logo" href="index.html" aria-label="' + esc(C.brand.name) + ' — на главную">' + (C.brand.showMark ? logoMark : '') + '<span class="logo__text">' + esc(C.brand.name) + '</span></a>' +
          '<div class="header__actions">' +
            '<button class="icon-btn" type="button" data-open="search" aria-label="Поиск" aria-controls="search-panel">' + icon('search') + '</button>' +
            '<a class="icon-btn hide-sm" href="catalog.html?fav=1" aria-label="Избранное">' + icon('heart') + '<span class="count-badge" data-fav-count></span></a>' +
            '<button class="icon-btn" type="button" data-open="cart" aria-label="Корзина" aria-controls="drawer-cart">' + icon('bag') + '<span class="count-badge" data-cart-count></span></button>' +
          '</div>' +
        '</div>' +
        '<div class="mega" id="mega" data-mega>' +
          '<div class="container mega__inner">' +
            '<div><p class="mega__title">Категории</p><ul class="mega__cats">' + cats + '</ul></div>' +
            '<div><p class="mega__title">Подборки</p><ul class="mega__links">' +
              '<li><a href="catalog.html?sort=new">Новые поступления</a></li>' +
              '<li><a href="catalog.html?sale=1">Со скидкой</a></li>' +
              '<li><a href="catalog.html?sort=pop">Чаще всего покупают</a></li>' +
              '<li><a href="catalog.html?max=3000">Подарки до 3 000 ₽</a></li>' +
              '<li><a href="index.html#look">Собрать стол</a></li>' +
              '<li><a href="about.html#makers">Все мастерские</a></li>' +
            '</ul></div>' +
            '<a class="mega__feature" href="catalog.html?cat=' + D.categories[0].id + '" data-mega-feature>' +
              '<img src="' + img(firstCover, 'sm') + '" alt="" width="520" height="650" loading="lazy">' +
              '<p><strong data-mega-feature-title>' + esc(D.categories[0].name) + '</strong><span class="muted" data-mega-feature-desc>' + esc(D.categories[0].desc) + '</span></p>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</header>';
  }

  function initMega() {
    var btn = $('[data-mega-toggle]'), mega = $('[data-mega]'), header = $('[data-header]');
    if (!btn || !mega) return;
    var hoverT;
    function set(open) {
      mega.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open);
    }
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    if (window.matchMedia('(hover: hover)').matches) {
      btn.addEventListener('mouseenter', function () { clearTimeout(hoverT); hoverT = setTimeout(function () { set(true); }, 120); });
      btn.addEventListener('mouseleave', function () { clearTimeout(hoverT); });
      header.addEventListener('mouseleave', function () { clearTimeout(hoverT); hoverT = setTimeout(function () { set(false); }, 200); });
      mega.addEventListener('mouseenter', function () { clearTimeout(hoverT); });
    }
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mega.classList.contains('is-open')) { set(false); btn.focus(); } });
    doc.addEventListener('click', function (e) { if (!header.contains(e.target)) set(false); });
    // Превью категории справа при наведении
    var fImg = $('[data-mega-feature] img'), fTitle = $('[data-mega-feature-title]'), fDesc = $('[data-mega-feature-desc]'), fLink = $('[data-mega-feature]');
    $$('.mega__cats a').forEach(function (a) {
      function show() {
        var c = catById[new URLSearchParams(a.search).get('cat')]; if (!c) return;
        fImg.src = img(byId[c.cover], 'sm'); fTitle.textContent = c.name; fDesc.textContent = c.desc; fLink.href = a.href;
      }
      a.addEventListener('mouseenter', show); a.addEventListener('focus', show);
    });
  }

  /* ---------- Подвал ---------- */
  function renderFooter() {
    var host = $('[data-site-footer]'); if (!host) return;
    var catLinks = D.categories.map(function (c) { return '<li><a href="catalog.html?cat=' + c.id + '">' + esc(c.name) + '</a></li>'; }).join('');
    var cols = C.footer.map(function (col) {
      return '<div class="footer__col"><h3>' + esc(col.title) + '</h3><ul>' + col.links.map(function (l) { return '<li><a href="' + l.href + '">' + esc(l.label) + '</a></li>'; }).join('') + '</ul></div>';
    }).join('');
    var socials = C.contacts.socials.map(function (s) { return '<a href="' + s.url + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>'; }).join('');
    host.outerHTML =
      '<footer class="footer">' +
        '<div class="container">' +
          '<div class="footer__top">' +
            '<div class="footer__sub">' +
              '<h2 class="h3">Раз в месяц пишем о новых мастерских и партиях</h2>' +
              '<p>Без скидочного спама: только новые вещи, истории мастеров и закрытые предзаказы для подписчиков.</p>' +
              '<form class="sub-form" data-subscribe novalidate>' +
                '<label class="visually-hidden" for="sub-email">Электронная почта</label>' +
                '<input id="sub-email" type="email" name="email" placeholder="Ваша почта" autocomplete="email" required>' +
                '<button type="submit">Подписаться' + icon('arrow') + '</button>' +
              '</form>' +
              '<p class="sub-note" data-sub-note aria-live="polite">Нажимая кнопку, вы соглашаетесь получать письма. Отписаться можно в один клик.</p>' +
            '</div>' +
            '<div class="footer__col"><h3>Каталог</h3><ul>' + catLinks + '</ul></div>' +
            cols +
            '<div class="footer__col footer__contacts"><h3>Контакты</h3>' +
              '<a class="footer__phone" href="tel:' + C.contacts.phoneHref + '">' + esc(C.contacts.phone) + '</a>' +
              '<p><a href="mailto:' + C.contacts.email + '">' + esc(C.contacts.email) + '</a><br>' + esc(C.contacts.address) + '<br>' + esc(C.contacts.hours) + '</p>' +
              '<div class="footer__social">' + socials + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="footer__wordmark" aria-hidden="true">' + esc(C.brand.name) + '</div>' +
          '<div class="footer__bottom">' +
            '<span>© ' + C.brand.year + ' ' + esc(C.brand.legalName) + ', ИНН ' + esc(C.brand.inn) + '</span>' +
            '<nav aria-label="Документы"><a href="delivery.html#return">Политика возврата</a><a href="#">Публичная оферта</a><a href="#">Политика конфиденциальности</a></nav>' +
            '<div class="pay-row" aria-label="Способы оплаты"><span>МИР</span><span>VISA</span><span>MASTERCARD</span><span>СБП</span></div>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  function fitWordmark() {
    var w = $('.footer__wordmark'); if (!w) return;
    var box = w.parentNode;
    function fit() {
      w.style.fontSize = '100px';
      var avail = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) - parseFloat(getComputedStyle(box).paddingRight);
      var span = w.firstChild && w.firstChild.nodeType === 1 ? w.firstChild : null;
      if (!span) { w.innerHTML = '<span style="display:inline-block">' + w.innerHTML + '</span>'; span = w.firstChild; }
      w.style.fontSize = Math.floor(100 * avail / span.getBoundingClientRect().width * 0.995) + 'px';
    }
    fit();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fit);
    window.addEventListener('resize', debounce(fit, 150));
  }

  function initSubscribe() {
    $$('[data-subscribe]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type=email]');
        var note = form.parentNode.querySelector('[data-sub-note]');
        var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        if (!ok) { note.textContent = 'Проверьте адрес — кажется, в нём опечатка.'; note.classList.remove('is-ok'); input.focus(); return; }
        if (C.subscribeEndpoint) {
          fetch(C.subscribeEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ email: input.value.trim() }) }).catch(function () {});
        }
        note.textContent = 'Готово! Первое письмо придёт в начале месяца.'; note.classList.add('is-ok');
        form.reset();
      });
    });
  }

  /* ---------- Оверлеи: корзина, меню, поиск ---------- */
  function renderOverlays() {
    var wrap = doc.createElement('div');
    wrap.innerHTML =
      '<div class="scrim" data-scrim></div>' +
      '<aside class="drawer drawer--right" id="drawer-cart" data-drawer="cart" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabindex="-1">' +
        '<div class="drawer__head"><h2 class="drawer__title" id="cart-title">Корзина<sup data-cart-title-count></sup></h2>' +
        '<button class="icon-btn" type="button" data-close aria-label="Закрыть корзину">' + icon('close') + '</button></div>' +
        '<div class="drawer__body" data-cart-body></div>' +
        '<div class="drawer__foot" data-cart-foot></div>' +
      '</aside>' +
      '<aside class="drawer drawer--left" id="drawer-menu" data-drawer="menu" role="dialog" aria-modal="true" aria-label="Меню" tabindex="-1">' +
        '<div class="drawer__head"><a class="logo" href="index.html">' + (C.brand.showMark ? logoMark : '') + '<span class="logo__text">' + esc(C.brand.name) + '</span></a>' +
        '<button class="icon-btn" type="button" data-close aria-label="Закрыть меню">' + icon('close') + '</button></div>' +
        '<div class="drawer__body">' +
          '<ul class="mmenu__cats">' + D.categories.map(function (c) { return '<li><a href="catalog.html?cat=' + c.id + '">' + esc(c.name) + '<sup>' + catCount(c.id) + '</sup></a></li>'; }).join('') + '</ul>' +
          '<div class="mmenu__links"><a href="catalog.html">Весь каталог</a><a href="catalog.html?sort=new">Новинки</a><a href="catalog.html?fav=1">Избранное</a>' +
          C.nav.slice(1).map(function (n) { return '<a href="' + n.href + '">' + esc(n.label) + '</a>'; }).join('') + '</div>' +
          '<div class="mmenu__contact"><a href="tel:' + C.contacts.phoneHref + '">' + esc(C.contacts.phone) + '</a><span>' + esc(C.contacts.hours) + '</span><span>' + esc(C.contacts.address) + '</span></div>' +
        '</div>' +
      '</aside>' +
      '<div class="search" id="search-panel" data-drawer="search" role="dialog" aria-modal="true" aria-label="Поиск по каталогу" tabindex="-1">' +
        '<div class="container">' +
          '<form class="search__bar" action="catalog.html" role="search">' + icon('search') +
            '<label class="visually-hidden" for="search-input">Поиск</label>' +
            '<input class="search__input" id="search-input" name="q" type="search" placeholder="Ваза, лён, латунь…" autocomplete="off" data-search-input>' +
            '<button class="icon-btn" type="button" data-close aria-label="Закрыть поиск">' + icon('close') + '</button>' +
          '</form>' +
          '<div class="search__body" data-search-body aria-live="polite"></div>' +
        '</div>' +
      '</div>' +
      '<div class="toast" data-toast role="status" aria-live="polite"></div>';
    while (wrap.firstChild) doc.body.appendChild(wrap.firstChild);
  }

  var openName = null, lastFocus = null;
  function openDrawer(name) {
    var el = $('[data-drawer="' + name + '"]'); if (!el) return;
    if (openName) closeDrawer(true);
    lastFocus = doc.activeElement;
    openName = name;
    el.classList.add('is-open');
    if (name !== 'search') $('[data-scrim]').classList.add('is-open');
    doc.body.classList.add('is-locked');
    var mega = $('[data-mega]'); if (mega) { mega.classList.remove('is-open'); var mb = $('[data-mega-toggle]'); if (mb) mb.setAttribute('aria-expanded', 'false'); }
    setTimeout(function () {
      var f = name === 'search' ? $('[data-search-input]') : el;
      f.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 60);
    if (name === 'search') renderSearch('');
    if (name === 'cart') renderCart();
  }
  function closeDrawer(silent) {
    if (!openName) return;
    var el = $('[data-drawer="' + openName + '"]');
    el.classList.remove('is-open');
    $('[data-scrim]').classList.remove('is-open');
    doc.body.classList.remove('is-locked');
    openName = null;
    if (!silent && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function trapFocus(e) {
    if (!openName || e.key !== 'Tab') return;
    var el = $('[data-drawer="' + openName + '"]');
    var f = $$('a[href], button:not([disabled]), input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])', el).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (doc.activeElement === first || doc.activeElement === el)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Корзина: отрисовка ---------- */
  function shipProgressHTML(sub) {
    var left = C.freeShippingFrom - sub;
    var pct = Math.min(1, sub / C.freeShippingFrom);
    return '<div class="ship-progress' + (left <= 0 ? ' is-done' : '') + '">' +
      (left > 0 ? 'До бесплатной доставки — <b class="tnum">' + fmt(left) + '</b>' : 'Доставка будет бесплатной') +
      '<div class="ship-progress__bar"><span style="transform:scaleX(' + pct.toFixed(3) + ')"></span></div></div>';
  }
  function renderCart() {
    var body = $('[data-cart-body]'), foot = $('[data-cart-foot]'); if (!body) return;
    var lines = Cart.lines();
    var n = Cart.count();
    $('[data-cart-title-count]').textContent = n ? n : '';
    if (!lines.length) {
      var picks = D.products.filter(function (p) { return p.stock > 0; }).sort(function (a, b) { return b.pop - a.pop; }).slice(0, 3);
      body.innerHTML = '<div class="cart-empty">' +
        '<svg viewBox="0 0 72 72" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M8 34h56c0 15-12.5 26-28 26S8 49 8 34Z"/><path d="M28 64h16"/><path d="M26 26c0-4 4-4 4-8s-4-4-4-8M36 26c0-4 4-4 4-8s-4-4-4-8M46 26c0-4 4-4 4-8s-4-4-4-8" opacity=".5"/></svg>' +
        '<p class="h4">Пока пусто</p><p class="muted small">Загляните в каталог — или начните с того, что чаще всего покупают:</p></div>' +
        '<div class="cart-suggest"><p class="cart-suggest__title">Популярное</p>' + picks.map(miniHTML).join('') + '</div>';
      foot.innerHTML = '<a class="btn btn--block" href="catalog.html">Перейти в каталог' + icon('arrow', 'icon-arrow') + '</a>';
      return;
    }
    var sub = Cart.subtotal();
    body.innerHTML = shipProgressHTML(sub) + lines.map(function (l) {
      return '<div class="line-item">' +
        '<a href="' + productUrl(l.p) + '"><img class="line-item__img" src="' + img(l.p, 'sm') + '" alt="" width="84" height="105" loading="lazy"></a>' +
        '<div>' +
          '<div class="line-item__top"><div><p class="line-item__title"><a href="' + productUrl(l.p) + '">' + esc(typo(l.p.title)) + '</a></p>' +
          '<p class="line-item__meta">' + (l.variant ? esc(l.variant) : esc(makerById[l.p.maker].name)) + '</p></div>' +
          '<span class="price' + (l.old ? ' price--sale' : '') + '"><span class="price__now">' + fmt(l.total) + '</span>' + (l.qty > 1 ? '<span class="price__old" style="text-decoration:none">' + l.qty + ' × ' + fmt(l.unit) + '</span>' : '') + '</span></div>' +
          '<div class="line-item__bottom">' +
            '<div class="stepper stepper--sm" role="group" aria-label="Количество">' +
              '<button type="button" data-qty="' + esc(l.key) + '" data-delta="-1" aria-label="Меньше">' + icon('minus') + '</button>' +
              '<output aria-live="polite">' + l.qty + '</output>' +
              '<button type="button" data-qty="' + esc(l.key) + '" data-delta="1" aria-label="Больше"' + (l.qty >= l.p.stock ? ' disabled' : '') + '>' + icon('plus') + '</button>' +
            '</div>' +
            '<button class="line-item__remove" type="button" data-remove="' + esc(l.key) + '">Удалить</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    var inCart = lines.map(function (l) { return l.p.id; });
    var add = D.products.filter(function (p) { return p.stock > 0 && inCart.indexOf(p.id) < 0 && p.price <= 3000; }).sort(function (a, b) { return b.pop - a.pop; }).slice(0, 3);
    if (add.length) body.innerHTML += '<div class="cart-suggest"><p class="cart-suggest__title">Добавить к заказу</p>' + add.map(miniHTML).join('') + '</div>';
    var savings = Cart.savings();
    foot.innerHTML = '<div class="totals">' +
        (savings ? '<div class="totals__row totals__row--muted"><span>Скидка</span><span>−' + fmt(savings) + '</span></div>' : '') +
        '<div class="totals__row totals__row--total"><span>Итого</span><span>' + fmt(sub) + '</span></div>' +
        '<p class="small muted">Доставка и промокод — на следующем шаге</p>' +
      '</div>' +
      '<a class="btn btn--block" href="checkout.html">Оформить заказ' + icon('arrow', 'icon-arrow') + '</a>';
  }
  function miniHTML(p) {
    return '<div class="mini"><a href="' + productUrl(p) + '"><img src="' + img(p, 'sm') + '" alt="" width="56" height="70" loading="lazy"></a>' +
      '<div><p class="mini__title"><a href="' + productUrl(p) + '">' + esc(p.title) + '</a></p><p class="mini__price">' + fmt(p.price) + '</p></div>' +
      '<button class="icon-btn" type="button" data-add="' + p.id + '" data-silent aria-label="Добавить: ' + esc(p.title) + '">' + icon('plus') + '</button></div>';
  }

  /* ---------- Поиск ---------- */
  // Простая «морфология»: отрезаем окончание, чтобы «ваза» находила «вазы», а «свеча» — «свечи»
  function stem(w) { return w.length > 3 ? w.replace(/(ами|ями|ов|ев|ей|ах|ях|ой|ый|ий|ая|яя|ое|ее|ые|ие|ом|ем|[аяыиоеуюьй])$/, '') : w; }
  function searchProducts(q) {
    var words = norm(q).split(/[\s,.]+/).filter(Boolean).map(stem);
    if (!words.length) return [];
    return D.products.filter(function (p) {
      var m = makerById[p.maker], c = catById[p.cat];
      var hay = norm([p.title, p.material, m.name, m.city, c.name, p.short].join(' '));
      return words.every(function (w) { return hay.indexOf(w) > -1; });
    }).sort(function (a, b) { return b.pop - a.pop; });
  }
  function highlight(text, q) {
    var t = esc(text);
    var w = norm(q).trim(); if (!w) return t;
    var first = stem(w.split(/\s+/)[0]);
    var i = norm(text).indexOf(first);
    if (i < 0 || !first) return t;
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + first.length)) + '</mark>' + esc(text.slice(i + first.length));
  }
  function hitHTML(p, q) {
    return '<a class="search-hit" href="' + productUrl(p) + '"><img src="' + img(p, 'sm') + '" alt="" width="520" height="650" loading="lazy"><p>' + highlight(p.title, q || '') + '<span>' + fmt(p.price) + '</span></p></a>';
  }
  function renderSearch(q) {
    var body = $('[data-search-body]'); if (!body) return;
    if (!q.trim()) {
      var tags = ['Ваза', 'Лён', 'Свеча', 'Кружка', 'Латунь', 'Дуб', 'Гжель'];
      var pop = D.products.slice().sort(function (a, b) { return b.pop - a.pop; }).slice(0, 6);
      body.innerHTML = '<div><p class="search__label">Часто ищут</p><div class="chips">' +
        tags.map(function (t) { return '<button class="chip" type="button" data-search-tag="' + t + '">' + t + '</button>'; }).join('') + '</div></div>' +
        '<div><p class="search__label">Популярное</p><div class="search__results">' + pop.map(function (p) { return hitHTML(p); }).join('') + '</div></div>';
      return;
    }
    var res = searchProducts(q);
    body.innerHTML = res.length
      ? '<div><p class="search__label">Нашлось ' + res.length + ' ' + plural(res.length, ['товар', 'товара', 'товаров']) + '</p><div class="search__results">' + res.slice(0, 12).map(function (p) { return hitHTML(p, q); }).join('') + '</div></div>' +
        (res.length > 12 ? '<a class="link-arrow" href="catalog.html?q=' + encodeURIComponent(q) + '"><span>Показать все</span>' + icon('arrow') + '</a>' : '')
      : '<div><p class="h4">По запросу «' + esc(q) + '» ничего нет</p><p class="muted" style="margin-top:8px">Попробуйте написать по-другому или посмотрите <a class="link" href="catalog.html">весь каталог</a>.</p></div>';
  }

  /* ---------- Тост ---------- */
  var toastT;
  function toast(html, imgSrc) {
    var t = $('[data-toast]'); if (!t) return;
    t.innerHTML = (imgSrc ? '<img src="' + imgSrc + '" alt="">' : '') + '<div class="toast__text">' + html + '</div>' +
      '<button class="btn btn--light btn--sm" type="button" data-open="cart">Корзина</button>';
    t.classList.add('is-open');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove('is-open'); }, 3800);
  }

  /* ---------- Счётчики в шапке ---------- */
  function updateBadges(bump) {
    var n = Cart.count();
    $$('[data-cart-count]').forEach(function (b) {
      b.textContent = n ? n : '';
      if (bump && n) { b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); }
    });
    $$('[data-fav-count]').forEach(function (b) { b.textContent = Favs.ids.length ? Favs.ids.length : ''; });
    var cartBtn = $('[data-open="cart"][aria-controls]');
    if (cartBtn) cartBtn.setAttribute('aria-label', 'Корзина' + (n ? ', ' + n + ' ' + plural(n, ['товар', 'товара', 'товаров']) : ''));
  }

  /* ---------- Лента с прокруткой ---------- */
  function initRail(root) {
    var track = $('.rail__track', root); if (!track) return;
    var section = root.closest('section') || root;
    var prev = $('[data-rail-prev]', section), next = $('[data-rail-next]', section), bar = $('.rail__progress span', root);
    function step() { var item = track.children[0]; return item ? item.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : 300; }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = track.scrollLeft >= max - 4;
      if (bar) {
        var vis = track.clientWidth / track.scrollWidth;
        bar.style.width = (vis * 100) + '%';
        bar.style.transform = 'translateX(' + (max > 0 ? (track.scrollLeft / max) * ((1 - vis) / vis) * 100 : 0) + '%)';
      }
    }
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', debounce(update, 30), { passive: true });
    window.addEventListener('resize', debounce(update, 100));
    update();
  }

  /* ---------- Появление при прокрутке ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
  function reveal(root) {
    $$('.reveal:not(.is-in)', root).forEach(function (el) { if (io && !reduceMotion) io.observe(el); else el.classList.add('is-in'); });
  }

  /* ---------- Делегирование кликов ---------- */
  function onClick(e) {
    var t = e.target.closest('button, a, [data-scrim]'); if (!t) return;

    if (t.hasAttribute('data-scrim')) return closeDrawer();
    if (t.hasAttribute('data-close')) return closeDrawer();

    var openTarget = t.getAttribute('data-open');
    if (openTarget) { e.preventDefault(); $('[data-toast]').classList.remove('is-open'); return openDrawer(openTarget); }

    var addId = t.getAttribute('data-add');
    if (addId) {
      e.preventDefault();
      var p = byId[addId];
      if (Cart.add(addId)) {
        if (t.hasAttribute('data-silent')) { renderCart(); return; }
        flashDone(t);
        toast('<strong>' + esc(p.title) + '</strong><span>добавлен в корзину · ' + fmt(p.price) + '</span>', img(p, 'sm'));
      }
      return;
    }

    var favId = t.getAttribute('data-fav');
    if (favId) {
      e.preventDefault();
      var on = Favs.toggle(favId);
      var title = byId[favId].title;
      $$('[data-fav="' + favId + '"]').forEach(function (b) {
        b.setAttribute('aria-pressed', on);
        if (b.classList.contains('card__fav')) b.setAttribute('aria-label', (on ? 'Убрать из избранного' : 'В избранное') + ': ' + title);
        b.classList.remove('is-pop'); void b.offsetWidth; if (on) b.classList.add('is-pop');
      });
      return;
    }

    var qtyKey = t.getAttribute('data-qty');
    if (qtyKey) {
      var line = Cart.items.filter(function (i) { return i.key === qtyKey; })[0];
      if (line) Cart.setQty(qtyKey, line.qty + parseInt(t.getAttribute('data-delta'), 10));
      return;
    }
    var rm = t.getAttribute('data-remove');
    if (rm) { Cart.remove(rm); return; }

    var tag = t.getAttribute('data-search-tag');
    if (tag) { var inp = $('[data-search-input]'); inp.value = tag; renderSearch(tag); inp.focus(); }
  }
  function flashDone(btn) {
    if (!btn.classList.contains('card__quick') && !btn.classList.contains('btn') && !btn.classList.contains('icon-btn')) return;
    btn.classList.add('is-done');
    var span = btn.querySelector('span');
    var prevText = span ? span.textContent : null;
    if (span) span.textContent = 'Добавлено';
    setTimeout(function () { btn.classList.remove('is-done'); if (span) span.textContent = prevText; }, 1600);
  }

  /* ---------- Шапка прячется при прокрутке вниз на телефоне ---------- */
  function initHeaderScroll() {
    var h = $('[data-header]'); if (!h) return;
    var lastY = scrollY, ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = scrollY;
        var hide = y > 400 && y > lastY + 4 && window.innerWidth < 1024 && !openName;
        if (y < lastY - 4 || y < 400) hide = false;
        if (hide !== h.classList.contains('is-hidden')) { h.classList.toggle('is-hidden', hide); h.style.transform = hide ? 'translateY(-100%)' : ''; }
        lastY = y; ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Запуск ---------- */
  function init() {
    renderHeader();
    renderFooter();
    renderOverlays();
    initMega();
    initSubscribe();
    fitWordmark();
    initHeaderScroll();
    updateBadges();
    doc.addEventListener('click', onClick);
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openName) closeDrawer(); trapFocus(e); });
    doc.addEventListener('cart:change', function () { updateBadges(true); if (openName === 'cart') renderCart(); });
    doc.addEventListener('fav:change', function () { updateBadges(); });
    var si = $('[data-search-input]');
    si.addEventListener('input', debounce(function () { renderSearch(si.value); }, 120));
    // Синхронизация между вкладками
    window.addEventListener('storage', function (e) {
      if (!e.key || e.key.indexOf(KEY + ':') !== 0) return;
      Cart.items = storage.get('cart', []); Favs.ids = storage.get('favs', []);
      updateBadges(); if (openName === 'cart') renderCart();
    });
    if (location.hash === '#cart') openDrawer('cart');
  }

  window.Shop = {
    C: C, D: D, $: $, $$: $$, esc: esc, fmt: fmt, plural: plural, norm: norm, params: params, debounce: debounce,
    byId: byId, catById: catById, makerById: makerById, catCount: catCount,
    img: img, productUrl: productUrl, icon: icon, stars: stars, tagsHTML: tagsHTML,
    unitPrice: unitPrice, unitOld: unitOld, discountPct: discountPct, priceHTML: priceHTML,
    typo: typo, Cart: Cart, Favs: Favs, Recent: Recent, storage: storage,
    card: card, miniHTML: miniHTML, searchProducts: searchProducts,
    openDrawer: openDrawer, closeDrawer: closeDrawer, toast: toast, flashDone: flashDone,
    initRail: initRail, reveal: reveal, shipProgressHTML: shipProgressHTML, reduceMotion: reduceMotion
  };

  init();
})();
