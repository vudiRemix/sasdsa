/* Контентные страницы (о магазине, доставка, 404): подставляем данные из config.js и data.js */
(function () {
  'use strict';
  var S = window.Shop, C = S.C, D = S.D, $ = S.$, $$ = S.$$, esc = S.esc, fmt = S.fmt, icon = S.icon;

  // О магазине: карточки мастерских
  var grid = $('[data-makers-grid]');
  if (grid) {
    grid.innerHTML = D.makers.map(function (m, i) {
      var items = D.products.filter(function (p) { return p.maker === m.id; });
      return '<a class="maker reveal" style="--i:' + (i % 3) + '" id="maker-' + m.id + '" href="catalog.html?maker=' + m.id + '">' +
        '<div class="maker__top"><div><p class="maker__name">' + esc(m.name) + '</p><p class="maker__city">' + esc(m.city) + ' · ' + esc(m.craft) + '</p></div>' +
        '<span class="maker__since">с ' + m.since + '</span></div>' +
        '<p>' + esc(S.typo(m.about)) + '</p>' +
        '<div class="maker__thumbs">' + items.slice(0, 4).map(function (p) { return '<img src="' + S.img(p, 'sm') + '" alt="" width="520" height="650" loading="lazy">'; }).join('') + '</div>' +
        '<div class="maker__foot"><span>' + items.length + ' ' + S.plural(items.length, ['вещь', 'вещи', 'вещей']) + ' в каталоге</span>' + icon('arrow').replace('<svg', '<svg width="18" height="18"') + '</div>' +
      '</a>';
    }).join('');
  }
  $$('[data-join-mail]').forEach(function (a) { a.href = 'mailto:' + C.contacts.email + '?subject=' + encodeURIComponent('Хочу стать поставщиком'); });

  // Доставка: таблица способов и оплата — из config.js
  var rows = $('[data-ship-rows]');
  if (rows) {
    rows.innerHTML = C.shipping.map(function (s) {
      return '<tr><td>' + esc(s.title) + '<span>' + esc(s.desc) + '</span></td><td>' + esc(s.eta) + '</td><td>' +
        (s.price ? fmt(s.price) + '<span>бесплатно от ' + fmt(C.freeShippingFrom) + '</span>' : 'Бесплатно') + '</td></tr>';
    }).join('');
  }
  var pay = $('[data-pay-list]');
  if (pay) pay.innerHTML = C.payment.map(function (p) { return '<li><b>' + esc(p.title) + '</b><span>' + esc(p.desc) + '</span></li>'; }).join('');
  var lead = $('[data-free-lead]');
  if (lead) lead.textContent = 'Отправляем в день заказа, если оформить до 15:00. Доставка курьером и в пункт выдачи — бесплатно от ' + fmt(C.freeShippingFrom) + '. Вернуть вещь можно в течение 14 дней.';
  $$('[data-mail]').forEach(function (a) { a.href = 'mailto:' + C.contacts.email; a.textContent = C.contacts.email; });
  $$('[data-address]').forEach(function (el) { el.textContent = C.contacts.address; });
  $$('[data-hours]').forEach(function (el) { el.textContent = C.contacts.hours; });
  $$('[data-phone]').forEach(function (a) { a.href = 'tel:' + C.contacts.phoneHref; a.querySelector('span').textContent = C.contacts.phone; });

  // 404: популярное
  var pop = $('[data-popular]');
  if (pop) pop.innerHTML = D.products.filter(function (p) { return p.stock > 0; }).sort(function (a, b) { return b.pop - a.pop; }).slice(0, 4).map(function (p) { return S.card(p); }).join('');

  // Подсветка пункта содержания при прокрутке
  var toc = $$('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (e.isIntersecting) toc.forEach(function (a) { var on = a.getAttribute('href') === '#' + e.target.id; a.style.color = on ? 'var(--c-ink)' : ''; a.style.fontWeight = on ? '500' : ''; });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    toc.forEach(function (a) { var t = $(a.getAttribute('href')); if (t) io.observe(t); });
  }

  S.reveal(document);
})();
