/* Каталог: фильтры, сортировка, поиск, избранное. Состояние живёт в адресной строке. */
(function () {
  'use strict';
  var S = window.Shop, D = S.D, $ = S.$, $$ = S.$$, esc = S.esc, fmt = S.fmt, icon = S.icon;
  var PER_PAGE = 12;

  var PRICE_PRESETS = [
    { label: 'до 2 000', min: null, max: 2000 },
    { label: '2–5 тыс.', min: 2000, max: 5000 },
    { label: '5–15 тыс.', min: 5000, max: 15000 },
    { label: 'от 15 тыс.', min: 15000, max: null }
  ];

  /* ---------- Состояние ---------- */
  var q = S.params();
  var st = {
    cat: S.catById[q.get('cat')] ? q.get('cat') : '',
    q: (q.get('q') || '').trim(),
    sort: q.get('sort') || 'pop',
    fav: q.get('fav') === '1',
    sale: q.get('sale') === '1',
    fresh: q.get('new') === '1',
    stock: q.get('stock') === '1',
    min: q.get('min') ? +q.get('min') : null,
    max: q.get('max') ? +q.get('max') : null,
    makers: (q.get('maker') || '').split(',').filter(function (m) { return S.makerById[m]; }),
    shown: PER_PAGE
  };
  var cols = S.storage.get('cols', 3);

  function writeUrl() {
    var p = new URLSearchParams();
    if (st.cat) p.set('cat', st.cat);
    if (st.q) p.set('q', st.q);
    if (st.sort !== 'pop') p.set('sort', st.sort);
    if (st.fav) p.set('fav', '1');
    if (st.sale) p.set('sale', '1');
    if (st.fresh) p.set('new', '1');
    if (st.stock) p.set('stock', '1');
    if (st.min != null) p.set('min', st.min);
    if (st.max != null) p.set('max', st.max);
    if (st.makers.length) p.set('maker', st.makers.join(','));
    var s = p.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }

  /* ---------- Фильтрация ---------- */
  function filtered(skip) {
    skip = skip || {};
    var hits = st.q ? S.searchProducts(st.q).map(function (p) { return p.id; }) : null;
    return D.products.filter(function (p) {
      if (st.cat && !skip.cat && p.cat !== st.cat) return false;
      if (hits && hits.indexOf(p.id) < 0) return false;
      if (st.fav && !S.Favs.has(p.id)) return false;
      if (st.sale && !p.old) return false;
      if (st.fresh && p.badges.indexOf('new') < 0) return false;
      if (st.stock && p.stock <= 0) return false;
      if (!skip.price && st.min != null && p.price < st.min) return false;
      if (!skip.price && st.max != null && p.price > st.max) return false;
      if (!skip.makers && st.makers.length && st.makers.indexOf(p.maker) < 0) return false;
      return true;
    });
  }
  function sorted(list) {
    var by = {
      pop: function (a, b) { return b.pop - a.pop; },
      'new': function (a, b) { return b.added.localeCompare(a.added); },
      'price-asc': function (a, b) { return a.price - b.price; },
      'price-desc': function (a, b) { return b.price - a.price; },
      rating: function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; }
    }[st.sort] || function () { return 0; };
    // Товары не в наличии — всегда в конце
    return list.slice().sort(function (a, b) { return ((a.stock <= 0) - (b.stock <= 0)) || by(a, b); });
  }
  function filtersCount() {
    return (st.sale ? 1 : 0) + (st.fresh ? 1 : 0) + (st.stock ? 1 : 0) + (st.min != null || st.max != null ? 1 : 0) + st.makers.length;
  }

  /* ---------- Шапка страницы ---------- */
  function renderHead(n) {
    var c = S.catById[st.cat];
    var title = st.fav ? 'Избранное' : st.q ? 'Поиск' : c ? c.name : 'Каталог';
    $('[data-title]').textContent = title;
    document.title = (st.q ? 'Поиск: ' + st.q : title) + ' — ' + S.C.brand.name.charAt(0).toUpperCase() + S.C.brand.name.slice(1);
    $('[data-count]').textContent = (st.q ? '«' + st.q + '» — ' : '') + n + ' ' + S.plural(n, ['товар', 'товара', 'товаров']);
    var desc = $('[data-desc]');
    if (c && !st.fav && !st.q) { desc.textContent = c.desc; desc.hidden = false; } else desc.hidden = true;

    var crumbs = '<li><a href="index.html">Главная</a></li>' +
      (c || st.fav || st.q ? '<li><a href="catalog.html">Каталог</a></li><li aria-current="page">' + esc(title) + '</li>' : '<li aria-current="page">Каталог</li>');
    $('[data-crumbs]').innerHTML = crumbs;

    var base = filtered({ cat: true });
    $('[data-cat-chips]').innerHTML =
      '<a class="chip" href="catalog.html" data-cat=""' + (!st.cat ? ' aria-current="page"' : '') + '>Все <span class="chip__n">' + base.length + '</span></a>' +
      D.categories.map(function (cat) {
        var k = base.filter(function (p) { return p.cat === cat.id; }).length;
        return '<a class="chip" href="catalog.html?cat=' + cat.id + '" data-cat="' + cat.id + '"' + (st.cat === cat.id ? ' aria-current="page"' : '') + '>' + esc(cat.name) + ' <span class="chip__n">' + k + '</span></a>';
      }).join('');
  }

  /* ---------- Панель фильтров ---------- */
  function filtersHTML(pfx) {
    var forMakers = filtered({ makers: true });
    var makers = D.makers.map(function (m) {
      var k = forMakers.filter(function (p) { return p.maker === m.id; }).length;
      var on = st.makers.indexOf(m.id) > -1;
      if (!k && !on) return '';
      return '<label class="check"><input type="checkbox" data-maker="' + m.id + '"' + (on ? ' checked' : '') + '><span class="check__box">' + icon('check') + '</span>' +
        '<span>' + esc(m.name) + '</span><span class="check__n">' + k + '</span></label>';
    }).join('');
    var presets = PRICE_PRESETS.map(function (pr, i) {
      var on = st.min === pr.min && st.max === pr.max;
      return '<button class="chip" type="button" data-preset="' + i + '" aria-pressed="' + on + '">' + pr.label + '</button>';
    }).join('');
    function sw(key, label) {
      return '<label class="switch"><span>' + label + '</span><input type="checkbox" data-flag="' + key + '"' + (st[key] ? ' checked' : '') + '><span class="switch__track"></span></label>';
    }
    return '<div class="fgroup"><p class="fgroup__title">Наличие и цена</p>' + sw('stock', 'Только в наличии') + sw('sale', 'Со скидкой') + sw('fresh', 'Новинки') + '</div>' +
      '<div class="fgroup"><p class="fgroup__title" id="' + pfx + 'price">Цена, ₽</p>' +
        '<div class="price-range" role="group" aria-labelledby="' + pfx + 'price">' +
          '<label class="visually-hidden" for="' + pfx + 'min">От</label><input class="input" id="' + pfx + 'min" inputmode="numeric" placeholder="от" data-min value="' + (st.min != null ? st.min : '') + '">' +
          '<label class="visually-hidden" for="' + pfx + 'max">До</label><input class="input" id="' + pfx + 'max" inputmode="numeric" placeholder="до" data-max value="' + (st.max != null ? st.max : '') + '">' +
        '</div>' +
        '<div class="chips" style="margin-top:10px">' + presets + '</div>' +
      '</div>' +
      '<div class="fgroup"><p class="fgroup__title">Мастерская</p>' + (makers || '<p class="small muted">Нет подходящих</p>') + '</div>' +
      (filtersCount() ? '<div class="fgroup" style="border:0"><button class="link small" type="button" data-reset>Сбросить фильтры</button></div>' : '');
  }
  function renderFilters() {
    $('[data-filters]').innerHTML = filtersHTML('d-');
    $('[data-filters-m]').innerHTML = filtersHTML('m-');
    var n = filtersCount();
    $('[data-filters-n]').textContent = n ? ' · ' + n : '';
  }
  function renderActive() {
    var chips = [];
    function chip(label, key) { chips.push('<button class="chip" type="button" data-clear="' + key + '">' + esc(label) + icon('close') + '</button>'); }
    if (st.q) chip('«' + st.q + '»', 'q');
    if (st.stock) chip('В наличии', 'stock');
    if (st.sale) chip('Со скидкой', 'sale');
    if (st.fresh) chip('Новинки', 'fresh');
    if (st.min != null || st.max != null) chip((st.min != null ? 'от ' + S.fmt(st.min) + ' ' : '') + (st.max != null ? 'до ' + S.fmt(st.max) : ''), 'price');
    st.makers.forEach(function (m) { chip(S.makerById[m].name, 'maker:' + m); });
    $('[data-active]').innerHTML = chips.join('');
  }

  /* ---------- Сетка ---------- */
  function promoTile() {
    var L = D.look;
    return '<a class="promo-tile reveal" href="index.html#look">' +
      '<img src="' + L.image + '-md.webp" alt="" width="1000" height="667" loading="lazy">' +
      '<div class="promo-tile__body"><p class="eyebrow">Готовая сервировка</p>' +
      '<p class="h3">' + esc(L.title) + '</p><p class="small" style="max-width:36ch;opacity:.85">' + L.items.length + ' вещей с одной фотографии — от досок до стаканов. Можно купить всё сразу.</p>' +
      '<span class="link-arrow"><span>Смотреть</span>' + icon('arrow') + '</span></div></a>';
  }
  function renderGrid() {
    var list = sorted(filtered());
    var grid = $('[data-grid]');
    renderHead(list.length);
    renderFilters();
    renderActive();
    $('[data-show-btn]').textContent = 'Показать ' + list.length + ' ' + S.plural(list.length, ['товар', 'товара', 'товаров']);

    var empty = $('[data-empty]');
    if (!list.length) {
      grid.innerHTML = '';
      empty.hidden = false;
      empty.innerHTML = st.fav && !filtersCount()
        ? '<p class="h3">В избранном пока ничего</p><p>Нажимайте на сердечко на карточке товара — так удобно собрать вещи, к которым хочется вернуться.</p><a class="btn" href="catalog.html">Перейти в каталог' + icon('arrow', 'icon-arrow') + '</a>'
        : '<p class="h3">Под такие условия ничего не подошло</p><p>Попробуйте убрать часть фильтров или поискать в другой категории.</p><button class="btn" type="button" data-reset>Сбросить фильтры</button>';
      $('[data-more]').hidden = true;
      return;
    }
    empty.hidden = true;
    var showPromo = !st.cat && !st.q && !st.fav && !filtersCount() && list.length > 6;
    // Плитка-врезка занимает две ячейки — добавляем ещё один товар, чтобы ряды были полными
    var page = list.slice(0, st.shown + (showPromo ? 1 : 0));
    var html = page.map(function (p, i) { return S.card(p, { i: i % 4, reveal: true, eager: i < 4 }); });
    if (showPromo) html.splice(4, 0, promoTile());
    grid.innerHTML = html.join('');

    var more = $('[data-more]');
    more.hidden = list.length <= PER_PAGE;
    $('[data-more-text]').textContent = 'Показано ' + page.length + ' из ' + list.length;
    $('[data-more-bar]').style.width = (page.length / list.length * 100) + '%';
    $('[data-more-btn]').hidden = page.length >= list.length;
    S.reveal(grid);
  }

  function update(resetPage) {
    if (resetPage !== false) st.shown = PER_PAGE;
    writeUrl();
    renderGrid();
  }

  /* ---------- События ---------- */
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-flag]')) { st[t.getAttribute('data-flag')] = t.checked; update(); }
    else if (t.matches('[data-maker]')) {
      var id = t.getAttribute('data-maker');
      st.makers = t.checked ? st.makers.concat(id) : st.makers.filter(function (m) { return m !== id; });
      update();
    }
    else if (t.matches('[data-min], [data-max]')) {
      var v = parseInt(String(t.value).replace(/\D/g, ''), 10);
      st[t.matches('[data-min]') ? 'min' : 'max'] = isNaN(v) ? null : v;
      if (st.min != null && st.max != null && st.min > st.max) { var x = st.min; st.min = st.max; st.max = x; }
      update();
    }
    else if (t.matches('[data-sort]')) { st.sort = t.value; update(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches('[data-min], [data-max]')) e.target.dispatchEvent(new Event('change', { bubbles: true }));
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-preset], [data-reset], [data-clear], [data-cat], button[data-cols], [data-more-btn]');
    if (!t) return;
    if (t.hasAttribute('data-preset')) {
      var pr = PRICE_PRESETS[+t.getAttribute('data-preset')];
      var same = st.min === pr.min && st.max === pr.max;
      st.min = same ? null : pr.min; st.max = same ? null : pr.max; update();
    } else if (t.hasAttribute('data-reset')) {
      st.sale = st.fresh = st.stock = false; st.min = st.max = null; st.makers = []; st.q = ''; update();
    } else if (t.hasAttribute('data-clear')) {
      var k = t.getAttribute('data-clear');
      if (k === 'price') st.min = st.max = null;
      else if (k === 'q') st.q = '';
      else if (k.indexOf('maker:') === 0) st.makers = st.makers.filter(function (m) { return m !== k.slice(6); });
      else st[k] = false;
      update();
    } else if (t.hasAttribute('data-cat')) {
      e.preventDefault();
      st.cat = t.getAttribute('data-cat'); st.fav = false; update();
      window.scrollTo({ top: 0, behavior: S.reduceMotion ? 'auto' : 'smooth' });
    } else if (t.hasAttribute('data-cols')) {
      setCols(+t.getAttribute('data-cols'));
    } else if (t.hasAttribute('data-more-btn')) {
      st.shown += PER_PAGE; renderGrid();
      var cards = $$('[data-grid] .card'); var first = cards[st.shown - PER_PAGE];
      if (first) { var a = first.querySelector('.card__title a'); if (a) a.focus({ preventScroll: true }); }
    }
  });
  // Избранное поменялось — в режиме «Избранное» перерисовать
  document.addEventListener('fav:change', function () { if (st.fav) setTimeout(function () { renderGrid(); }, 250); });

  function setCols(n) {
    cols = n; S.storage.set('cols', n);
    $('[data-grid]').setAttribute('data-grid-cols', n);
    $$('[data-cols]').forEach(function (b) { if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', +b.getAttribute('data-cols') === n); });
  }

  $('[data-sort]').value = st.sort;
  setCols(cols);
  renderGrid();
})();
