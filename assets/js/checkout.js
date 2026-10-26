/* Оформление заказа: контакты, доставка, оплата, промокод, подтверждение */
(function () {
  'use strict';
  var S = window.Shop, C = S.C, $ = S.$, $$ = S.$$, esc = S.esc, fmt = S.fmt, icon = S.icon;
  var root = $('[data-checkout]');
  var saved = S.storage.get('checkout', {});
  var st = {
    ship: saved.ship || C.shipping[0].id,
    pay: saved.pay || C.payment[0].id,
    promo: S.storage.get('promo', '')
  };

  function shipById(id) { return C.shipping.filter(function (s) { return s.id === id; })[0] || C.shipping[0]; }
  function promoRate() { return C.promoCodes[String(st.promo).toUpperCase()] || 0; }
  function totals() {
    var sub = S.Cart.subtotal();
    var promo = Math.round(sub * promoRate());
    var s = shipById(st.ship);
    var free = sub - promo >= C.freeShippingFrom;
    var ship = s.price && !free ? s.price : 0;
    return { sub: sub, promo: promo, ship: ship, shipFree: free && s.price > 0, total: sub - promo + ship, savings: S.Cart.savings() };
  }

  /* ---------- Пустая корзина ---------- */
  function renderEmpty() {
    root.innerHTML = '<div class="empty" style="padding-block:var(--section)"><p class="h2">Корзина пустая</p>' +
      '<p>Оформлять пока нечего. Загляните в каталог — там 35 вещей от восьми мастерских.</p>' +
      '<a class="btn" href="catalog.html">В каталог' + icon('arrow', 'icon-arrow') + '</a></div>';
  }

  /* ---------- Форма ---------- */
  function field(o) {
    return '<div class="field' + (o.span ? ' span-2' : '') + '" data-field="' + o.name + '">' +
      '<label class="field__label" for="f-' + o.name + '">' + o.label + (o.optional ? ' <span class="muted" style="font-weight:400">— необязательно</span>' : '') + '</label>' +
      (o.textarea
        ? '<textarea class="textarea" id="f-' + o.name + '" name="' + o.name + '" rows="3" placeholder="' + (o.ph || '') + '">' + esc(saved[o.name] || '') + '</textarea>'
        : '<input class="input" id="f-' + o.name + '" name="' + o.name + '" type="' + (o.type || 'text') + '"' + (o.auto ? ' autocomplete="' + o.auto + '"' : '') + (o.mode ? ' inputmode="' + o.mode + '"' : '') +
          ' placeholder="' + (o.ph || '') + '" value="' + esc(saved[o.name] || '') + '"' + (o.optional ? '' : ' aria-required="true"') + ' aria-describedby="e-' + o.name + (o.hint ? ' h-' + o.name : '') + '">') +
      (o.hint ? '<p class="field__hint" id="h-' + o.name + '">' + o.hint + '</p>' : '') +
      '<p class="field__error" id="e-' + o.name + '">' + (o.err || 'Заполните поле') + '</p></div>';
  }
  function radioCards(name, list, cur, priceFn) {
    return list.map(function (x) {
      return '<label class="rcard"><input type="radio" name="' + name + '" value="' + x.id + '"' + (x.id === cur ? ' checked' : '') + '>' +
        '<span class="rcard__dot" aria-hidden="true"></span><span><span class="rcard__title">' + esc(x.title) + '</span><span class="rcard__desc">' + esc(x.desc) + '</span></span>' +
        (priceFn ? '<span class="rcard__price" data-ship-price="' + x.id + '">' + priceFn(x) + '</span>' : '<span></span>') + '</label>';
    }).join('');
  }
  function shipPriceLabel(x) {
    if (!x.price) return 'бесплатно';
    return totals().sub - Math.round(totals().sub * promoRate()) >= C.freeShippingFrom ? '<s class="muted">' + fmt(x.price) + '</s> 0 ₽' : fmt(x.price);
  }

  function renderForm() {
    root.innerHTML =
      '<div class="checkout">' +
        '<form class="checkout__form" novalidate data-form>' +
          '<h1 class="h2" style="margin-bottom:24px">Оформление заказа</h1>' +
          '<ol class="steps"><li data-n="1" class="is-done">Корзина</li><li data-n="2" class="is-current">Данные и оплата</li><li data-n="3">Готово</li></ol>' +
          '<div class="field__error" data-form-error role="alert" style="margin-bottom:24px;font-size:var(--fs-15)"></div>' +

          '<fieldset class="fs"><legend class="fs__legend"><span class="fs__n">01</span><span class="h4">Контакты</span></legend>' +
            '<div class="form-grid form-grid--2">' +
              field({ name: 'name', label: 'Имя и фамилия', auto: 'name', ph: 'Анна Смирнова', err: 'Напишите, как к вам обращаться' }) +
              field({ name: 'phone', label: 'Телефон', type: 'tel', auto: 'tel', mode: 'tel', ph: '+7 (___) ___-__-__', err: 'Нужен номер из 10 цифр после +7' }) +
              field({ name: 'email', label: 'Почта', type: 'email', auto: 'email', mode: 'email', ph: 'anna@mail.ru', span: true, hint: 'Пришлём чек и трек-номер', err: 'Проверьте адрес — кажется, в нём опечатка' }) +
            '</div>' +
          '</fieldset>' +

          '<fieldset class="fs"><legend class="fs__legend"><span class="fs__n">02</span><span class="h4">Доставка</span></legend>' +
            '<div class="radio-cards" data-ship-list>' + radioCards('ship', C.shipping, st.ship, shipPriceLabel) + '</div>' +
            '<div class="form-grid form-grid--2" style="margin-top:24px" data-address>' +
              field({ name: 'city', label: 'Город', auto: 'address-level2', ph: 'Москва', err: 'Укажите город' }) +
              field({ name: 'zip', label: 'Индекс', auto: 'postal-code', mode: 'numeric', ph: '127055', optional: true }) +
              field({ name: 'address', label: 'Улица, дом, квартира', auto: 'street-address', ph: 'Новослободская, 16А, кв. 12', span: true, err: 'Укажите адрес доставки' }) +
              field({ name: 'comment', label: 'Комментарий', textarea: true, span: true, optional: true, ph: 'Код домофона, удобное время, как найти подъезд' }) +
            '</div>' +
            '<div data-pickup hidden><div class="maker-card" style="margin-top:24px"><span class="maker-card__mono" aria-hidden="true">' + icon('pin') + '</span>' +
              '<p><strong>' + esc(C.contacts.address) + '</strong>' + esc(C.contacts.hours) + '. Заказ будет готов в день оформления после 15:00 — пришлём сообщение.</p></div></div>' +
          '</fieldset>' +

          '<fieldset class="fs"><legend class="fs__legend"><span class="fs__n">03</span><span class="h4">Оплата</span></legend>' +
            '<div class="radio-cards radio-cards--2">' + radioCards('pay', C.payment, st.pay) + '</div>' +
          '</fieldset>' +

          '<div class="field" data-field="consent" style="margin-bottom:24px">' +
            '<label class="check"><input type="checkbox" name="consent" id="f-consent" aria-describedby="e-consent"><span class="check__box">' + icon('check') + '</span>' +
            '<span>Согласен с <a class="link" href="#">условиями оферты</a> и <a class="link" href="#">обработкой персональных данных</a></span></label>' +
            '<p class="field__error" id="e-consent">Нужно согласие, чтобы оформить заказ</p>' +
          '</div>' +
          '<button class="btn btn--accent btn--block" type="submit" data-submit style="min-height:60px;font-size:var(--fs-16)"></button>' +
        '</form>' +

        '<aside class="summary" aria-labelledby="sum-title">' +
          '<div style="display:flex;justify-content:space-between;align-items:baseline"><h2 class="h4" id="sum-title">Ваш заказ</h2><button class="link small" type="button" data-open="cart">Изменить</button></div>' +
          '<div class="summary__items" data-items></div>' +
          '<div><div class="promo-code"><label class="visually-hidden" for="promo">Промокод</label>' +
            '<input class="input" id="promo" placeholder="Промокод" value="' + esc(st.promo) + '" data-promo autocomplete="off">' +
            '<button class="btn btn--outline" type="button" data-promo-apply>Применить</button></div>' +
            '<p class="promo-code__msg" data-promo-msg aria-live="polite"></p></div>' +
          '<div class="totals" data-totals></div>' +
          '<p class="secure-note">' + icon('lock') + '<span>Оплата проходит на защищённой странице банка. Мы не видим и не храним данные карты.</span></p>' +
        '</aside>' +
      '</div>';
    bind();
    renderSummary();
    toggleAddress();
    if (st.promo) applyPromo(true);
  }

  function renderSummary() {
    if (!S.Cart.items.length) return renderEmpty();
    var t = totals();
    $('[data-items]').innerHTML = S.Cart.lines().map(function (l) {
      return '<div class="sum-item"><span class="sum-item__img"><img src="' + S.img(l.p, 'sm') + '" alt="" width="56" height="70" loading="lazy"><span class="sum-item__qty">' + l.qty + '</span></span>' +
        '<span class="sum-item__title">' + esc(l.p.title) + (l.variant ? '<span>' + esc(l.variant) + '</span>' : '') + '</span><b>' + fmt(l.total) + '</b></div>';
    }).join('');
    $('[data-totals]').innerHTML =
      '<div class="totals__row"><span>Товары, ' + S.Cart.count() + ' шт.</span><span>' + fmt(t.sub + t.savings) + '</span></div>' +
      (t.savings ? '<div class="totals__row totals__row--muted"><span>Скидка</span><span>−' + fmt(t.savings) + '</span></div>' : '') +
      (t.promo ? '<div class="totals__row totals__row--muted"><span>Промокод ' + esc(st.promo.toUpperCase()) + '</span><span>−' + fmt(t.promo) + '</span></div>' : '') +
      '<div class="totals__row totals__row--muted"><span>Доставка</span><span>' + (t.ship ? fmt(t.ship) : 'бесплатно') + '</span></div>' +
      '<div class="totals__row totals__row--total"><span>Итого</span><span>' + fmt(t.total) + '</span></div>' +
      (t.sub - t.promo < C.freeShippingFrom ? S.shipProgressHTML(t.sub - t.promo).replace('class="ship-progress', 'style="border:0;padding-bottom:0" class="ship-progress') : '');
    $$('[data-ship-price]').forEach(function (el) { el.innerHTML = shipPriceLabel(shipById(el.getAttribute('data-ship-price'))); });
    var btn = $('[data-submit]');
    if (btn) btn.innerHTML = (st.pay === 'cash' ? 'Оформить заказ на ' : st.pay === 'split' ? 'Оплатить частями: 4 × ' + fmt(Math.ceil(t.total / 4)) + '<span class="visually-hidden"> из </span>' : 'Оплатить ') + (st.pay === 'split' ? '' : fmt(t.total)) + icon('arrow', 'icon-arrow');
  }

  function toggleAddress() {
    var s = shipById(st.ship);
    $('[data-address]').hidden = !s.needsAddress;
    $('[data-pickup]').hidden = s.needsAddress;
    var zip = $('[data-field="zip"]'); if (zip) zip.hidden = s.id !== 'post';
  }

  function applyPromo(silent) {
    var input = $('[data-promo]'), msg = $('[data-promo-msg]');
    var code = input.value.trim();
    if (!code) { st.promo = ''; S.storage.set('promo', ''); msg.textContent = ''; renderSummary(); return; }
    if (C.promoCodes[code.toUpperCase()]) {
      st.promo = code.toUpperCase(); S.storage.set('promo', st.promo);
      msg.className = 'promo-code__msg is-ok'; msg.textContent = 'Промокод применён: −' + Math.round(promoRate() * 100) + '% на товары';
    } else {
      st.promo = ''; S.storage.set('promo', '');
      if (!silent) { msg.className = 'promo-code__msg is-err'; msg.textContent = 'Такого промокода нет. Попробуйте ОБИХОД10'; }
    }
    renderSummary();
  }

  /* ---------- Маска телефона ---------- */
  function phoneDigits(v) {
    var d = String(v).replace(/\D/g, '');
    if (d.length && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
    return d.slice(0, 10);
  }
  function formatPhone(d) {
    if (!d.length) return '';
    var out = '+7 (' + d.slice(0, 3);
    if (d.length >= 3) out += ') ' + d.slice(3, 6);
    if (d.length >= 6) out += '-' + d.slice(6, 8);
    if (d.length >= 8) out += '-' + d.slice(8, 10);
    return out;
  }

  /* ---------- Проверка ---------- */
  var rules = {
    name: function (v) { return v.trim().length >= 2; },
    phone: function (v) { return phoneDigits(v).length === 10; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
    city: function (v) { return !shipById(st.ship).needsAddress || v.trim().length >= 2; },
    address: function (v) { return !shipById(st.ship).needsAddress || v.trim().length >= 5; }
  };
  function check(name) {
    var wrap = $('[data-field="' + name + '"]'); if (!wrap) return true;
    var input = $('[name="' + name + '"]', wrap);
    var ok = name === 'consent' ? input.checked : (rules[name] ? rules[name](input.value) : true);
    wrap.classList.toggle('is-invalid', !ok);
    input.setAttribute('aria-invalid', !ok);
    return ok;
  }

  function bind() {
    var form = $('[data-form]');
    var phone = $('#f-phone');
    phone.addEventListener('input', function () { phone.value = formatPhone(phoneDigits(phone.value)); });
    phone.addEventListener('focus', function () { if (!phone.value) phone.value = '+7 ('; });
    phone.addEventListener('blur', function () { if (phoneDigits(phone.value).length === 0) phone.value = ''; });

    form.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'ship') { st.ship = t.value; toggleAddress(); renderSummary(); persist(); }
      if (t.name === 'pay') { st.pay = t.value; renderSummary(); persist(); }
      if (t.name === 'consent') check('consent');
    });
    // Проверяем поле, когда пользователь из него ушёл, и снимаем ошибку, как только поправил
    form.addEventListener('focusout', function (e) { var n = e.target.name; if (rules[n] && e.target.value) check(n); persist(); });
    form.addEventListener('input', function (e) { var w = e.target.closest('.field.is-invalid'); if (w) check(e.target.name); });

    $('[data-promo-apply]').addEventListener('click', function () { applyPromo(false); });
    $('[data-promo]').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyPromo(false); } });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var names = ['name', 'phone', 'email', 'city', 'address', 'consent'];
      var bad = names.filter(function (n) { return !check(n); });
      var err = $('[data-form-error]');
      if (bad.length) {
        err.style.display = 'block';
        err.textContent = 'Проверьте ' + bad.length + ' ' + S.plural(bad.length, ['поле', 'поля', 'полей']) + ' — они отмечены красным.';
        var first = $('[name="' + bad[0] + '"]'); first.focus(); first.scrollIntoView({ block: 'center', behavior: S.reduceMotion ? 'auto' : 'smooth' });
        return;
      }
      err.style.display = 'none';
      submitOrder(form);
    });
  }
  function persist() {
    var form = $('[data-form]'); if (!form) return;
    var data = { ship: st.ship, pay: st.pay };
    ['name', 'phone', 'email', 'city', 'zip', 'address'].forEach(function (n) { var el = form.elements[n]; if (el) data[n] = el.value; });
    S.storage.set('checkout', data);
  }

  function submitOrder(form) {
    var btn = $('[data-submit]');
    btn.classList.add('is-loading'); btn.textContent = 'Отправляем…';
    var t = totals();
    var order = {
      number: 'ОБ-' + String(Date.now()).slice(-6),
      createdAt: new Date().toISOString(),
      customer: { name: form.elements.name.value.trim(), phone: form.elements.phone.value, email: form.elements.email.value.trim() },
      delivery: { method: shipById(st.ship).title, city: form.elements.city.value.trim(), zip: form.elements.zip.value.trim(), address: form.elements.address.value.trim(), comment: form.elements.comment.value.trim() },
      payment: C.payment.filter(function (x) { return x.id === st.pay; })[0].title,
      promo: st.promo || null,
      items: S.Cart.lines().map(function (l) { return { id: l.p.id, title: l.p.title, variant: l.variant, qty: l.qty, price: l.unit, total: l.total }; }),
      totals: t
    };
    var done = function () { showSuccess(order); };
    if (C.orderEndpoint) {
      fetch(C.orderEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(order) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
        .catch(function () {
          btn.classList.remove('is-loading'); renderSummary();
          var err = $('[data-form-error]'); err.style.display = 'block';
          err.textContent = 'Не получилось отправить заказ. Проверьте интернет и попробуйте ещё раз — или позвоните нам: ' + C.contacts.phone;
        });
    } else {
      setTimeout(done, 700); // демо-режим
    }
  }

  /* ---------- Заказ оформлен ---------- */
  function showSuccess(o) {
    var lines = S.Cart.lines();
    S.Cart.clear(); S.storage.set('promo', '');
    var first = o.customer.name.split(' ')[0];
    var pickup = st.ship === 'pickup';
    root.innerHTML = '<div class="success">' +
      '<span class="success__badge">' + icon('check') + '</span>' +
      '<ol class="steps" style="margin:0"><li data-n="1" class="is-done">Корзина</li><li data-n="2" class="is-done">Данные и оплата</li><li data-n="3" class="is-current">Готово</li></ol>' +
      '<h1 class="h2">' + esc(first) + ', спасибо! Заказ ' + esc(o.number) + ' оформлен</h1>' +
      '<p class="lead">Мы отправили подтверждение на ' + esc(o.customer.email) + '. Менеджер позвонит в течение часа, если понадобится что-то уточнить.</p>' +
      '<ol class="timeline">' +
        '<li><i>01</i><div><b>Собираем заказ</b><span>Проверяем каждую вещь и упаковываем в стружку — сегодня до 18:00</span></div></li>' +
        (pickup
          ? '<li><i>02</i><div><b>Ждём в шоуруме</b><span>' + esc(C.contacts.address) + ' — пришлём сообщение, когда всё будет готово</span></div></li>'
          : '<li><i>02</i><div><b>Передаём в доставку</b><span>' + esc(o.delivery.method) + ' — трек-номер придёт на почту</span></div></li>' +
            '<li><i>03</i><div><b>Привозим</b><span>' + esc(o.delivery.city) + ', ' + esc(o.delivery.address) + '</span></div></li>') +
      '</ol>' +
      '<div class="summary" style="position:static"><div class="summary__items" style="max-height:none">' + lines.map(function (l) {
        return '<div class="sum-item"><span class="sum-item__img"><img src="' + S.img(l.p, 'sm') + '" alt="" width="56" height="70"><span class="sum-item__qty">' + l.qty + '</span></span>' +
          '<span class="sum-item__title">' + esc(l.p.title) + (l.variant ? '<span>' + esc(l.variant) + '</span>' : '') + '</span><b>' + fmt(l.total) + '</b></div>';
      }).join('') + '</div><div class="totals"><div class="totals__row totals__row--total"><span>Итого · ' + esc(o.payment) + '</span><span>' + fmt(o.totals.total) + '</span></div></div></div>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn" href="catalog.html">Продолжить покупки' + icon('arrow', 'icon-arrow') + '</a><a class="btn btn--outline" href="index.html">На главную</a></div>' +
    '</div>';
    document.title = 'Заказ оформлен — ' + C.brand.name;
    window.scrollTo(0, 0);
    root.querySelector('h1').setAttribute('tabindex', '-1'); root.querySelector('h1').focus();
  }

  document.addEventListener('cart:change', function () { if ($('[data-form]')) renderSummary(); });

  if (!S.Cart.items.length) renderEmpty(); else renderForm();
})();
