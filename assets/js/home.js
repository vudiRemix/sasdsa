/* Главная страница: всё, что берётся из data.js */
(function () {
  'use strict';
  var S = window.Shop, D = S.D, $ = S.$, esc = S.esc, fmt = S.fmt, icon = S.icon;

  // Первый экран: подпись и точка на фото
  var hero = $('[data-hero-product]');
  if (hero) {
    var hp = S.byId[hero.getAttribute('data-hero-product')], hm = S.makerById[hp.maker];
    $('[data-hero-caption]').innerHTML = '<span>На фото: ' + esc(hp.title.replace(/,.*$/, '')) + ', ' + esc(hm.name) + ', ' + esc(hm.city) + '</span>' +
      '<a class="link tnum" href="' + S.productUrl(hp) + '">' + fmt(hp.price) + '</a>';
    var spot = document.createElement('a');
    spot.className = 'hotspot hotspot--pulse';
    spot.href = S.productUrl(hp);
    spot.style.left = hero.getAttribute('data-hotspot-x') + '%';
    spot.style.top = hero.getAttribute('data-hotspot-y') + '%';
    spot.setAttribute('aria-label', hp.title + ' — ' + fmt(hp.price));
    spot.innerHTML = '<span class="hotspot__pop"><strong>' + esc(hp.title) + '</strong><span>' + fmt(hp.price) + '</span></span>';
    $('.hero__img', hero).appendChild(spot);
  }

  // Категории
  var all = $('[data-all-link] span'); if (all) all.textContent = 'Все ' + D.products.length + ' ' + S.plural(D.products.length, ['товар', 'товара', 'товаров']);
  $('[data-cats]').innerHTML = D.categories.map(function (c, i) {
    var p = S.byId[c.cover];
    return '<a class="cat reveal" style="--i:' + i + '" href="catalog.html?cat=' + c.id + '">' +
      '<div class="cat__img"><img src="' + S.img(p, 'sm') + '" alt="" width="520" height="650" loading="lazy" decoding="async"></div>' +
      '<span class="cat__name">' + esc(c.name) + '<sup>' + S.catCount(c.id) + '</sup></span></a>';
  }).join('');

  // Новинки — по дате поступления
  var fresh = D.products.slice().sort(function (a, b) { return b.added.localeCompare(a.added); }).slice(0, 10);
  $('[data-new-track]').innerHTML = fresh.map(function (p, i) { return S.card(p, { i: i % 4, reveal: true }); }).join('');
  S.initRail($('[data-rail]'));

  // Мастерские
  $('[data-makers-list]').innerHTML = D.makers.slice(0, 4).map(function (m) {
    var n = D.products.filter(function (p) { return p.maker === m.id; }).length;
    return '<a href="about.html#maker-' + m.id + '"><strong>' + esc(m.name) + '</strong><span>' + esc(m.city) + ' · ' + n + ' ' + S.plural(n, ['вещь', 'вещи', 'вещей']) + '</span>' + icon('arrow') + '</a>';
  }).join('');

  // Бегущая строка: дублируем группу для бесшовной прокрутки
  var tTrack = $('[data-ticker] .ticker__track');
  if (tTrack) { var g = tTrack.firstElementChild.cloneNode(true); g.setAttribute('aria-hidden', 'true'); tTrack.appendChild(g); }

  // Собрать стол
  var L = D.look, lookEl = $('[data-look]');
  if (L && lookEl) {
    $('[data-look-note]').textContent = L.note;
    var items = L.items.map(function (it) { return { p: S.byId[it.id], x: it.x, y: it.y }; });
    var total = items.reduce(function (s, it) { return s + it.p.price; }, 0);
    lookEl.innerHTML =
      '<div class="look__media reveal">' +
        '<img src="' + L.image + '-md.webp" srcset="' + L.image + '-md.webp 1000w, ' + L.image + '.webp 2000w" sizes="(min-width: 1024px) 64vw, 100vw" alt="' + esc(L.alt) + '" width="2000" height="1333" loading="lazy" decoding="async">' +
        items.map(function (it, i) {
          var side = it.x > 66 ? ' hotspot--right' : it.x < 34 ? ' hotspot--left' : '';
          return '<button class="hotspot' + side + '" type="button" style="left:' + it.x + '%;top:' + it.y + '%" data-look-spot="' + i + '" aria-label="' + (i + 1) + '. ' + esc(it.p.title) + ', ' + fmt(it.p.price) + '">' +
            '<span class="hotspot__pop"><strong>' + esc(it.p.title) + '</strong><span>' + fmt(it.p.price) + '</span></span></button>';
        }).join('') +
      '</div>' +
      '<div class="look__list reveal" style="--i:1">' +
        items.map(function (it, i) {
          return '<div class="look__item" data-look-item="' + i + '">' +
            '<span class="look__num">' + String(i + 1).padStart(2, '0') + '</span>' +
            '<a href="' + S.productUrl(it.p) + '"><img src="' + S.img(it.p, 'sm') + '" alt="" width="64" height="80" loading="lazy"></a>' +
            '<div><p class="look__title"><a href="' + S.productUrl(it.p) + '">' + esc(S.typo(it.p.title)) + '</a></p><p class="look__price">' + fmt(it.p.price) + '</p></div>' +
            '<button class="icon-btn" type="button" data-add="' + it.p.id + '" aria-label="В корзину: ' + esc(it.p.title) + '">' + icon('plus') + '</button>' +
          '</div>';
        }).join('') +
        '<div class="look__total">' +
          '<p class="look__sum"><span>Весь стол, ' + items.length + ' ' + S.plural(items.length, ['вещь', 'вещи', 'вещей']) + '</span><strong class="tnum">' + fmt(total) + '</strong></p>' +
          '<button class="btn btn--block" type="button" data-add-look>Добавить всё в корзину' + icon('bag') + '</button>' +
        '</div>' +
      '</div>';

    function activate(i, scroll) {
      S.$$('[data-look-spot]').forEach(function (b) { b.classList.toggle('is-active', +b.getAttribute('data-look-spot') === i); });
      S.$$('[data-look-item]').forEach(function (r) { r.classList.toggle('is-active', +r.getAttribute('data-look-item') === i); });
      if (scroll && window.innerWidth < 1024) { var row = $('[data-look-item="' + i + '"]'); if (row) row.scrollIntoView({ behavior: S.reduceMotion ? 'auto' : 'smooth', block: 'nearest' }); }
    }
    lookEl.addEventListener('click', function (e) {
      var spot = e.target.closest('[data-look-spot]');
      if (spot) activate(+spot.getAttribute('data-look-spot'), true);
      if (e.target.closest('[data-add-look]')) {
        items.forEach(function (it) { S.Cart.add(it.p.id); });
        S.flashDone(e.target.closest('[data-add-look]'));
        S.toast('<strong>Весь стол в корзине</strong><span>' + items.length + ' ' + S.plural(items.length, ['вещь', 'вещи', 'вещей']) + ' · ' + fmt(total) + '</span>', S.img(items[0].p, 'sm'));
      }
    });
    S.$$('[data-look-item]').forEach(function (row) {
      row.addEventListener('mouseenter', function () { activate(+row.getAttribute('data-look-item')); });
    });
    lookEl.addEventListener('mouseleave', function () { activate(-1); });
  }

  // Популярное
  var pop = D.products.filter(function (p) { return p.stock > 0; }).sort(function (a, b) { return b.pop - a.pop; }).slice(0, 8);
  $('[data-popular]').innerHTML = pop.map(function (p, i) { return S.card(p, { i: i % 4, reveal: true }); }).join('');

  // Отзывы
  var total = D.products.reduce(function (s, p) { return s + p.reviews; }, 0);
  $('[data-score-meta]').innerHTML = S.stars(5) + '<span>средняя оценка по ' + total + ' ' + S.plural(total, ['отзыву', 'отзывам', 'отзывам']) + '</span>';
  $('[data-reviews]').innerHTML = D.reviews.slice(0, 3).map(function (r, i) {
    var p = S.byId[r.product];
    return '<figure class="review reveal" style="--i:' + i + '">' +
      S.stars(r.rating) +
      '<blockquote class="review__text">' + esc(S.typo(r.text)) + '</blockquote>' +
      '<figcaption class="review__foot"><a href="' + S.productUrl(p) + '" tabindex="-1" aria-hidden="true"><img src="' + S.img(p, 'sm') + '" alt="" width="44" height="55" loading="lazy"></a>' +
      '<span class="review__who">' + esc(r.name) + ', ' + esc(r.city) + '<span>о товаре <a href="' + S.productUrl(p) + '">' + esc(p.title) + '</a></span></span></figcaption>' +
    '</figure>';
  }).join('');

  S.reveal(document);
})();
