/* Страница товара: галерея, варианты, покупка, отзывы, похожие товары */
(function () {
  'use strict';
  var S = window.Shop, D = S.D, C = S.C, $ = S.$, $$ = S.$$, esc = S.esc, fmt = S.fmt, icon = S.icon, typo = S.typo;

  var id = S.params().get('id');
  var p = S.byId[id] || null;
  var root = $('[data-pdp]');

  if (!p) {
    $('[data-crumbs]').innerHTML = '<li><a href="index.html">Главная</a></li><li><a href="catalog.html">Каталог</a></li>';
    root.innerHTML = '<div class="empty"><p class="h2">Такого товара нет</p><p>Возможно, его уже раскупили или ссылка устарела. Посмотрите, что есть в каталоге сейчас.</p><a class="btn" href="catalog.html">В каталог' + icon('arrow', 'icon-arrow') + '</a></div>';
    $('[data-reviews-section]').hidden = true;
    $('[data-related-section] h2').textContent = 'Популярное';
    $('[data-related]').innerHTML = D.products.slice().sort(function (a, b) { return b.pop - a.pop; }).slice(0, 8).map(function (x) { return S.card(x); }).join('');
    S.initRail($('[data-rail-related]'));
    return;
  }

  var m = S.makerById[p.maker], cat = S.catById[p.cat];
  var sel = { color: p.colors && p.colors.length ? 0 : null, option: p.option ? 0 : null, qty: 1 };
  var brand = C.brand.name.charAt(0).toUpperCase() + C.brand.name.slice(1);
  document.title = p.title + ' — ' + brand;
  var md = document.querySelector('meta[name=description]'); if (md) md.setAttribute('content', p.short);
  S.Recent.push(p.id);

  $('[data-crumbs]').innerHTML = '<li><a href="index.html">Главная</a></li><li><a href="catalog.html">Каталог</a></li>' +
    '<li><a href="catalog.html?cat=' + cat.id + '">' + esc(cat.name) + '</a></li><li aria-current="page">' + esc(p.title) + '</li>';

  /* ---------- Галерея ---------- */
  var shots = [
    { src: S.img(p), w: 1000, h: 1250, cls: 'gallery__item--main', alt: p.title, cap: '' },
    { src: S.img(p, 'detail'), w: 800, h: 1000, cls: '', alt: p.title + ' — крупный план', cap: 'Крупный план' },
    { src: S.img(p, 'full'), w: 1400, h: 933, cls: 'gallery__item--wide', alt: p.title + ' — общий вид', cap: 'Общий вид' }
  ];
  var galleryHTML = '<div><div class="gallery" data-gallery>' + shots.map(function (s, i) {
    return '<figure class="gallery__item ' + s.cls + '"' + (s.cls === 'gallery__item--wide' ? ' style="aspect-ratio:4/3"' : '') + '>' +
      '<button type="button" data-zoom="' + i + '" style="display:block;width:100%;height:100%" aria-label="Открыть фото ' + (i + 1) + ' из ' + shots.length + '">' +
      '<img src="' + s.src + '" alt="' + esc(s.alt) + '" width="' + s.w + '" height="' + s.h + '"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + ' decoding="async"></button>' +
      (s.cap ? '<figcaption>' + s.cap + '</figcaption>' : '') + '</figure>';
  }).join('') + '</div><div class="gallery-dots" aria-hidden="true">' + shots.map(function (s, i) { return '<span' + (i ? '' : ' class="is-active"') + '></span>'; }).join('') + '</div></div>';

  /* ---------- Покупка ---------- */
  function colorHTML() {
    if (!p.colors || p.colors.length < 2 || !p.colors[0].n) return '';
    return '<div class="opt"><p class="opt__label" id="opt-color">Цвет: <span data-color-name>' + esc(p.colors[sel.color].n) + '</span></p>' +
      '<div class="opt__swatches" role="radiogroup" aria-labelledby="opt-color">' + p.colors.map(function (c, i) {
        return '<button class="swatch-btn" type="button" role="radio" aria-checked="' + (i === sel.color) + '" aria-label="' + esc(c.n) + '" title="' + esc(c.n) + '" data-color="' + i + '"><span style="background:' + esc(c.h) + '"></span></button>';
      }).join('') + '</div></div>';
  }
  function optionHTML() {
    if (!p.option) return '';
    return '<div class="opt"><p class="opt__label" id="opt-opt">' + esc(p.option.label) + '</p>' +
      '<div class="seg" role="radiogroup" aria-labelledby="opt-opt">' + p.option.values.map(function (v, i) {
        return '<button type="button" role="radio" aria-checked="' + (i === sel.option) + '" data-option="' + i + '">' + esc(v.n) +
          (v.d ? '<small>' + (v.d > 0 ? '+' : '−') + fmt(Math.abs(v.d)) + '</small>' : '') + '</button>';
      }).join('') + '</div></div>';
  }
  function stockHTML() {
    if (p.stock <= 0) return '<p class="stock stock--out">Нет в наличии — новая партия ожидается в ноябре</p>';
    if (p.stock <= 3) return '<p class="stock stock--low">Осталось ' + p.stock + ' шт. — следующая партия через 3–4 недели</p>';
    return '<p class="stock">В наличии, отправим ' + (new Date().getHours() < 15 ? 'сегодня' : 'завтра') + '</p>';
  }
  function shipHTML() {
    return '<div class="ship-table">' + C.shipping.map(function (s) {
      return '<div>' + icon(s.icon) + '<span><b style="font-weight:500;color:var(--c-ink)">' + esc(s.title) + '</b> · ' + esc(s.eta) + '</span><b>' + (s.price ? 'от ' + fmt(s.price) : 'бесплатно') + '</b></div>';
    }).join('') + '</div><p class="small muted" style="margin-top:10px">Бесплатная доставка курьером и в пункт выдачи — от ' + fmt(C.freeShippingFrom) + '</p>';
  }
  function specsHTML() {
    return '<dl class="specs">' + [['Материал', p.material]].concat(p.specs).concat([['Мастерская', m.name + ', ' + m.city]]).map(function (r) {
      return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>';
    }).join('') + '</dl>';
  }
  var sku = 'Арт. ' + (10400 + parseInt(p.id.slice(1), 10));
  var fav = S.Favs.has(p.id);
  var pct = S.discountPct(p);

  var infoHTML =
    '<div class="pdp__info">' +
      '<div class="pdp__head">' +
        '<p class="pdp__maker"><a href="about.html#maker-' + m.id + '">' + esc(m.name) + '</a> · ' + esc(m.city) + '</p>' +
        '<h1 class="pdp__title display">' + esc(typo(p.title)) + '</h1>' +
        '<div class="pdp__meta"><span class="rating">' + S.stars(p.rating) + '<span>' + String(p.rating).replace('.', ',') + '</span></span>' +
          '<a href="#reviews">' + p.reviews + ' ' + S.plural(p.reviews, ['отзыв', 'отзыва', 'отзывов']) + '</a><span>' + sku + '</span></div>' +
      '</div>' +
      '<div class="pdp__price"><span data-price>' + S.priceHTML(p, sel.option) + '</span>' +
        (pct ? '<span class="tag tag--sale">−' + pct + '%</span>' : '') + '</div>' +
      '<p class="pdp__split" data-split></p>' +
      '<p class="pdp__short">' + esc(typo(p.short)) + '</p>' +
      colorHTML() + optionHTML() +
      '<div class="buy" data-buy>' +
        (p.stock > 0
          ? '<div class="stepper" role="group" aria-label="Количество">' +
              '<button type="button" data-step="-1" aria-label="Меньше" disabled>' + icon('minus') + '</button>' +
              '<output data-qty-out aria-live="polite">1</output>' +
              '<button type="button" data-step="1" aria-label="Больше">' + icon('plus') + '</button></div>' +
            '<button class="btn" type="button" data-buy-btn><span>В корзину</span><span class="btn__price" data-btn-price></span></button>'
          : '<button class="btn btn--outline" type="button" data-notify style="grid-column:span 2">' + icon('bell') + '<span>Сообщить о поступлении</span></button>') +
        '<button class="buy__fav" type="button" data-fav="' + p.id + '" aria-pressed="' + fav + '" aria-label="В избранное">' + icon('heart') + '</button>' +
      '</div>' +
      stockHTML() +
      shipHTML() +
      '<div>' +
        '<details class="acc" open><summary>Описание<span class="acc__icon"></span></summary><div class="acc__body"><p>' + esc(typo(p.desc)) + '</p></div></details>' +
        '<details class="acc"><summary>Характеристики<span class="acc__icon"></span></summary><div class="acc__body">' + specsHTML() + '</div></details>' +
        '<details class="acc"><summary>Уход<span class="acc__icon"></span></summary><div class="acc__body"><p>' + esc(typo(p.care)) + '</p></div></details>' +
        '<details class="acc"><summary>Доставка и возврат<span class="acc__icon"></span></summary><div class="acc__body"><p>Отправляем в день заказа, если оформить до 15:00. Упаковываем в бумажную стружку и двойной картон — если что-то разобьётся в пути, заменим за наш счёт.</p><p>Вернуть вещь можно в течение 14 дней: курьер сам заберёт посылку, деньги придут за 1–3 дня. <a class="link" href="delivery.html">Все условия</a></p></div></details>' +
      '</div>' +
      '<div class="maker-card"><span class="maker-card__mono" aria-hidden="true">' + esc(m.name.replace(/^(Мастерская|Гончарня|Ткацкая|Столярка)\s+/, '').charAt(0)) + '</span>' +
        '<p><strong>' + esc(m.name) + '</strong>' + esc(typo(m.about)) + ' <a href="catalog.html?maker=' + m.id + '">Все вещи мастерской</a></p></div>' +
    '</div>';

  root.innerHTML = '<div class="pdp">' + galleryHTML + infoHTML + '</div>';

  /* ---------- Цена и выбор ---------- */
  function refreshPrice() {
    var unit = S.unitPrice(p, sel.option);
    $('[data-price]').innerHTML = S.priceHTML(p, sel.option);
    $('[data-split]').innerHTML = 'Частями: <b>4 × ' + fmt(Math.ceil(unit / 4)) + '</b> без переплаты';
    var bp = $('[data-btn-price]'); if (bp) bp.textContent = fmt(unit * sel.qty);
    renderBuybar();
  }
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-color], [data-option], [data-step], [data-buy-btn], [data-notify], [data-zoom]');
    if (!t) return;
    if (t.hasAttribute('data-color')) {
      sel.color = +t.getAttribute('data-color');
      $$('[data-color]').forEach(function (b) { b.setAttribute('aria-checked', b === t); });
      $('[data-color-name]').textContent = p.colors[sel.color].n;
    } else if (t.hasAttribute('data-option')) {
      sel.option = +t.getAttribute('data-option');
      $$('[data-option]').forEach(function (b) { b.setAttribute('aria-checked', b === t); });
      refreshPrice();
    } else if (t.hasAttribute('data-step')) {
      sel.qty = Math.max(1, Math.min(p.stock, sel.qty + +t.getAttribute('data-step')));
      $('[data-qty-out]').textContent = sel.qty;
      $('[data-step="-1"]').disabled = sel.qty <= 1;
      $('[data-step="1"]').disabled = sel.qty >= p.stock;
      refreshPrice();
    } else if (t.hasAttribute('data-buy-btn')) {
      addToCart(t);
    } else if (t.hasAttribute('data-notify')) {
      S.toast('<strong>Напишем, когда появится</strong><span>Оставьте почту при следующем заказе или подпишитесь на рассылку внизу страницы</span>');
    } else if (t.hasAttribute('data-zoom')) {
      openLightbox(+t.getAttribute('data-zoom'));
    }
  });
  // Стрелки для радиогрупп
  root.addEventListener('keydown', function (e) {
    var t = e.target; if (!t.matches('[role=radio]')) return;
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].indexOf(e.key) < 0) return;
    e.preventDefault();
    var group = $$('[role=radio]', t.parentNode), i = group.indexOf(t);
    var next = group[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + group.length) % group.length];
    next.focus(); next.click();
  });
  function addToCart(btn) {
    if (S.Cart.add(p.id, { color: sel.color, option: sel.option, qty: sel.qty })) {
      var label = btn.querySelector('span');
      btn.classList.add('is-done'); if (label) label.textContent = 'Добавлено';
      setTimeout(function () { btn.classList.remove('is-done'); if (label) label.textContent = 'В корзину'; }, 1600);
      var variant = [];
      if (sel.color != null && p.colors[sel.color].n && p.colors.length > 1) variant.push(p.colors[sel.color].n);
      if (sel.option != null) variant.push(p.option.values[sel.option].n);
      S.toast('<strong>' + esc(p.title) + '</strong><span>' + (variant.length ? esc(variant.join(' · ')) + ' · ' : '') + sel.qty + ' шт. · ' + fmt(S.unitPrice(p, sel.option) * sel.qty) + '</span>', S.img(p, 'sm'));
    }
  }

  /* ---------- Липкая панель покупки на телефоне ---------- */
  var buybar = $('[data-buybar]');
  function renderBuybar() {
    buybar.innerHTML = '<div class="buybar__info"><strong>' + esc(p.title) + '</strong>' + S.priceHTML(p, sel.option) + '</div>' +
      (p.stock > 0 ? '<button class="btn" type="button" data-bar-buy>В корзину</button>' : '<button class="btn btn--outline" type="button" data-bar-notify>Сообщить</button>');
  }
  buybar.addEventListener('click', function (e) {
    if (e.target.closest('[data-bar-buy]')) addToCart(e.target.closest('[data-bar-buy]'));
    if (e.target.closest('[data-bar-notify]')) $('[data-notify]').click();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      var show = !en[0].isIntersecting && en[0].boundingClientRect.top < 0;
      buybar.classList.toggle('is-visible', show);
      buybar.setAttribute('aria-hidden', !show);
    }).observe($('[data-buy]'));
  }
  refreshPrice();

  /* ---------- Карусель на телефоне: точки ---------- */
  var gal = $('[data-gallery]'), dots = $$('.gallery-dots span');
  gal.addEventListener('scroll', S.debounce(function () {
    var i = Math.round(gal.scrollLeft / gal.clientWidth);
    dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
  }, 40), { passive: true });

  /* ---------- Лайтбокс ---------- */
  var lb = $('[data-lightbox]'), lbImg = $('[data-lb-img]'), lbI = 0, lbReturn = null;
  function showLb(i) {
    lbI = (i + shots.length) % shots.length;
    lbImg.src = shots[lbI].src; lbImg.alt = shots[lbI].alt;
    $('[data-lb-count]').textContent = (lbI + 1) + ' / ' + shots.length;
  }
  function openLightbox(i) { lbReturn = document.activeElement; showLb(i); lb.classList.add('is-open'); document.body.classList.add('is-locked'); lb.focus(); }
  function closeLightbox() { lb.classList.remove('is-open'); document.body.classList.remove('is-locked'); if (lbReturn) lbReturn.focus(); }
  lb.addEventListener('click', function (e) {
    if (e.target.closest('[data-lb-close]') || e.target === lb.querySelector('.lightbox__stage')) closeLightbox();
    if (e.target.closest('[data-lb-prev]')) showLb(lbI - 1);
    if (e.target.closest('[data-lb-next]')) showLb(lbI + 1);
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showLb(lbI - 1);
    if (e.key === 'ArrowRight') showLb(lbI + 1);
  });

  /* ---------- С этим покупают ---------- */
  var related = D.products.filter(function (x) { return x.id !== p.id && x.stock > 0 && (x.maker === p.maker || x.cat === p.cat); })
    .sort(function (a, b) { return (b.maker === p.maker) - (a.maker === p.maker) || b.pop - a.pop; });
  if (related.length < 6) related = related.concat(D.products.filter(function (x) { return x.id !== p.id && related.indexOf(x) < 0 && x.stock > 0; }).sort(function (a, b) { return b.pop - a.pop; })).slice(0, 8);
  $('[data-related]').innerHTML = related.slice(0, 8).map(function (x, i) { return S.card(x, { i: i % 4, reveal: true }); }).join('');
  S.initRail($('[data-rail-related]'));

  /* ---------- Отзывы ---------- */
  var own = D.reviews.filter(function (r) { return r.product === p.id; });
  var similar = own.length ? [] : D.reviews.filter(function (r) { var x = S.byId[r.product]; return x.cat === p.cat || x.maker === p.maker; }).slice(0, 3);
  var list = own.length ? own : similar;
  var n = p.reviews;
  var five = Math.round(n * Math.max(0, Math.min(1, (p.rating - 4) * 1.05)));
  var four = Math.round((n - five) * 0.75), three = Math.round((n - five - four) * 0.7), two = Math.max(0, n - five - four - three - 1), one = n - five - four - three - two;
  var dist = [five, four, three, two, one];
  function dateRu(s) { var d = new Date(s); return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }); }
  $('[data-rv]').innerHTML =
    '<div class="rv__summary">' +
      '<h2 class="h3" id="rv-title">Отзывы</h2>' +
      '<div class="score"><span class="score__n">' + String(p.rating).replace('.', ',') + '</span><span class="score__meta">' + S.stars(p.rating) + '<span>' + n + ' ' + S.plural(n, ['оценка', 'оценки', 'оценок']) + '</span></span></div>' +
      '<div class="rv__bars">' + dist.map(function (k, i) {
        return '<div><span>' + (5 - i) + '</span><i><b style="width:' + (n ? Math.round(k / n * 100) : 0) + '%"></b></i><span>' + Math.max(0, k) + '</span></div>';
      }).join('') + '</div>' +
      '<a class="btn btn--outline" href="mailto:' + C.contacts.email + '?subject=' + encodeURIComponent('Отзыв: ' + p.title) + '">Написать отзыв</a>' +
    '</div>' +
    '<div class="rv__list">' +
      (similar.length ? '<p class="small muted" style="padding-bottom:16px">У этого товара пока мало текстовых отзывов — вот что пишут о похожих вещах:</p>' : '') +
      list.map(function (r) {
        var rp = S.byId[r.product];
        return '<article class="rv-item"><div class="rv-item__head"><strong>' + esc(r.name) + ', ' + esc(r.city) + '</strong><span>' + dateRu(r.date) + '</span></div>' +
          S.stars(r.rating) + '<p>' + esc(typo(r.text)) + '</p>' +
          (rp.id !== p.id ? '<p class="rv-item__tag">о товаре <a class="link" href="' + S.productUrl(rp) + '">' + esc(rp.title) + '</a></p>' : '') + '</article>';
      }).join('') +
    '</div>';

  /* ---------- Вы смотрели ---------- */
  var recent = S.Recent.ids().filter(function (x) { return x !== p.id; });
  if (recent.length >= 2) {
    $('[data-recent-section]').hidden = false;
    $('[data-recent]').innerHTML = recent.slice(0, 8).map(function (x) { return S.card(S.byId[x]); }).join('');
    S.initRail($('[data-rail-recent]'));
  }

  S.reveal(document);
})();
