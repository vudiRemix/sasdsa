/* Chaqqon Cargo: язык, контакты, калькулятор, тарифы, адрес склада, отслеживание */
(function () {
  'use strict';
  var C = window.CARGO, T = window.I18N;
  var doc = document;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem('chq:' + k); localStorage.setItem('chq:' + k, v); } catch (e) { return null; } }
  function fill(str, map) { return String(str).replace(/\{(\w+)\}/g, function (_, k) { return map[k] != null ? map[k] : ''; }); }

  var lang = store('lang') === 'tj' ? 'tj' : 'ru';
  function L(obj) { return obj == null ? '' : typeof obj === 'string' ? obj : (obj[lang] || obj.ru); }
  function D(key) { return T.dyn[lang][key]; }
  var nf = function (n, d) { return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: d || 0, minimumFractionDigits: 0 }).format(n); };

  /* ---------- Ссылки и контакты ---------- */
  var links = {
    bot: 'https://t.me/' + C.contacts.bot,
    wa: 'https://wa.me/' + C.contacts.whatsapp,
    tg: 'https://t.me/' + C.contacts.telegram,
    ig: 'https://instagram.com/' + C.contacts.instagram
  };
  function fillContacts() {
    $$('[data-bot]').forEach(function (a) { a.href = links.bot; });
    $$('[data-bot-name]').forEach(function (el) { el.textContent = '@' + C.contacts.bot; });
    $$('[data-wa]').forEach(function (a) { a.href = links.wa; });
    $$('[data-tg]').forEach(function (a) { a.href = links.tg; });
    $$('[data-ig]').forEach(function (a) { a.href = links.ig; });
    $$('[data-phone]').forEach(function (a) { a.href = 'tel:' + C.contacts.phoneHref; a.textContent = C.contacts.phone; });
    $$('[data-hours]').forEach(function (el) { el.textContent = L(C.contacts.hours); });
    $$('[data-year]').forEach(function (el) { el.textContent = C.year; });
  }

  /* ---------- Язык ---------- */
  $$('[data-i18n]').forEach(function (el) { el.setAttribute('data-ru', el.innerHTML); });
  $$('[data-i18n-ph]').forEach(function (el) { el.setAttribute('data-ru-ph', el.placeholder); });
  function applyLang() {
    doc.documentElement.lang = lang === 'tj' ? 'tg' : 'ru';
    $$('[data-i18n]').forEach(function (el) {
      var v = lang === 'tj' ? T.tj[el.getAttribute('data-i18n')] : null;
      el.innerHTML = v != null ? v : el.getAttribute('data-ru');
    });
    $$('[data-i18n-ph]').forEach(function (el) {
      var v = lang === 'tj' ? T.tj[el.getAttribute('data-i18n-ph')] : null;
      el.placeholder = v != null ? v : el.getAttribute('data-ru-ph');
    });
    $$('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang); });
    fillContacts(); renderStatic(); renderCalc(); renderAddr();
  }
  $$('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () { lang = b.getAttribute('data-lang'); store('lang', lang); applyLang(); });
  });

  /* ---------- Цифры, тарифы, пункты выдачи ---------- */
  function method(id) { return C.methods.filter(function (m) { return m.id === id; })[0]; }
  function range(m) { return m.days[0] + '–' + m.days[1]; }
  function renderStatic() {
    var auto = method('auto'), avia = method('avia');
    var minRate = Math.min.apply(null, C.categories.map(function (c) { return c.rates.auto; }).filter(Boolean));
    $('[data-fact="auto"]').textContent = range(auto);
    $('[data-fact="avia"]').textContent = range(avia);
    $('[data-fact="rate"]').textContent = '$' + nf(minRate, 1);
    $('[data-fact="points"]').textContent = C.pickup.length;
    $('[data-route-total]').textContent = fill(D('totalRoute'), { d: range(auto) });

    $$('[data-th-method]').forEach(function (th) { var m = method(th.getAttribute('data-th-method')); th.textContent = L(m.name) + ', ' + range(m) + ' ' + D('days'); });
    $('[data-tariffs]').innerHTML = C.categories.map(function (c) {
      return '<tr><td><b>' + esc(L(c.name)) + '</b><span>' + esc(L(c.hint)) + '</span></td>' +
        C.methods.map(function (m) { var r = c.rates[m.id]; return '<td>' + (r ? '<span class="price">$' + nf(r, 1) + '</span><span class="muted small">' + D('perKg') + '</span>' : '<span class="na">' + D('notAvailable') + '</span>') + '</td>'; }).join('') + '</tr>';
    }).join('');
    $('[data-notes]').innerHTML = D('notes').map(function (n) {
      return '<li><b>' + esc(n[0]) + '</b>' + esc(fill(n[1], { min: C.minWeight, div: C.volumeDivisor, ins: C.insurancePct, wh: C.wholesaleFrom })) + '</li>';
    }).join('');
    $('[data-points]').innerHTML = C.pickup.map(function (p, i) {
      return '<article class="point rv is-in" style="--i:' + i + '"><p class="point__city">' + esc(L(p.city)) + '</p>' +
        '<p><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/></svg>' + esc(L(p.address)) + '</p>' +
        '<p><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>' + esc(L(p.hours)) + '</p>' +
        '<a class="btn btn--ghost btn--sm" href="' + esc(p.map) + '" target="_blank" rel="noopener" style="justify-self:start">' + D('openMap') + '</a></article>';
    }).join('');
  }

  /* ---------- Калькулятор ---------- */
  var st = { method: 'auto', cat: C.categories[0].id, weight: 5, dims: false, size: [0, 0, 0], ins: false, value: 0 };
  function num(v) { var n = parseFloat(String(v).replace(',', '.')); return isNaN(n) || n < 0 ? 0 : n; }
  function calc() {
    var cat = C.categories.filter(function (c) { return c.id === st.cat; })[0];
    var mId = st.method, warn = '';
    if (!cat.rates[mId]) { mId = 'auto'; warn = D('noAvia'); }
    var rate = cat.rates[mId];
    var vol = st.dims ? st.size[0] * st.size[1] * st.size[2] / C.volumeDivisor : 0;
    var base = Math.max(st.weight, vol);
    var charge = Math.max(C.minWeight, Math.ceil(base * 10) / 10);
    var how = charge === C.minWeight && base < C.minWeight ? D('minNote') : vol > st.weight ? D('byVolume') : D('byFact');
    var ins = st.ins ? st.value * C.insurancePct / 100 : 0;
    var usd = charge * rate + ins;
    if (st.weight >= C.wholesaleFrom) warn = (warn ? warn + ' ' : '') + fill(D('wholesale'), { n: C.wholesaleFrom });
    return { cat: cat, m: method(mId), rate: rate, charge: charge, how: how, ins: ins, usd: usd, warn: warn };
  }
  function renderCalc() {
    $('[data-methods]').innerHTML = C.methods.map(function (m) {
      return '<button type="button" role="radio" aria-checked="' + (m.id === st.method) + '" data-method="' + m.id + '">' + esc(L(m.name)) + '<small>' + range(m) + ' ' + D('days') + '</small></button>';
    }).join('');
    $('[data-cats]').innerHTML = C.categories.map(function (c) {
      var r = c.rates[st.method];
      return '<label class="tile' + (r ? '' : ' is-off') + '"><input type="radio" name="cat" value="' + c.id + '"' + (c.id === st.cat ? ' checked' : '') + '>' +
        '<b>' + esc(L(c.name)) + '</b><span>' + esc(L(c.hint)) + '</span><em>' + (r ? '$' + nf(r, 1) : '—') + '</em></label>';
    }).join('');
    renderResult();
  }
  function renderResult() {
    var r = calc();
    var usdText = r.usd < 10 ? nf(r.usd, 1) : nf(Math.round(r.usd));
    var wa = links.wa + '?text=' + encodeURIComponent(fill(D('waText'), { method: L(r.m.name), cat: L(r.cat.name), kg: nf(r.charge, 1), usd: usdText }));
    $('[data-result]').innerHTML =
      '<div><p class="result__label">' + D('approx') + '</p><p class="result__price">$' + usdText + '</p><p class="result__tjs">≈ ' + nf(r.usd * C.usdToTjs) + ' ' + D('somoni') + '</p></div>' +
      '<dl class="result__rows">' +
        '<div><dt>' + D('chargeable') + '</dt><dd>' + nf(r.charge, 1) + ' ' + D('kg') + ' · ' + r.how + '</dd></div>' +
        '<div><dt>' + D('rate') + '</dt><dd>$' + nf(r.rate, 1) + D('perKg') + '</dd></div>' +
        (r.ins ? '<div><dt>' + D('insurance') + '</dt><dd>$' + nf(r.ins, 1) + '</dd></div>' : '') +
        '<div><dt>' + D('term') + '</dt><dd>' + esc(L(r.m.name)) + ', ' + range(r.m) + ' ' + D('days') + '</dd></div>' +
      '</dl>' +
      (r.warn ? '<p class="result__warn">' + esc(r.warn) + '</p>' : '') +
      '<div class="result__btns"><a class="btn btn--yellow btn--block" href="' + wa + '" target="_blank" rel="noopener">' + D('sendWa') + '</a>' +
      '<a class="btn btn--ghost-light btn--block" href="' + links.tg + '" target="_blank" rel="noopener">' + D('askTg') + '</a></div>' +
      '<p class="result__note">' + D('exact') + '</p>';
  }
  var form = $('[data-calc]');
  form.addEventListener('click', function (e) {
    var m = e.target.closest('[data-method]');
    if (m) { st.method = m.getAttribute('data-method'); renderCalc(); $('[data-method="' + st.method + '"]').focus(); }
    var s = e.target.closest('[data-step]');
    if (s) { st.weight = Math.max(0, Math.round((st.weight + +s.getAttribute('data-step')) * 10) / 10); $('[data-weight]').value = nf(st.weight, 1).replace(/\s/g, ''); renderResult(); }
  });
  form.addEventListener('keydown', function (e) {
    var m = e.target.closest('[data-method]');
    if (m && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); st.method = st.method === 'auto' ? 'avia' : 'auto'; renderCalc(); $('[data-method="' + st.method + '"]').focus(); }
  });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'cat') { st.cat = e.target.value; renderResult(); }
    if (e.target.matches('[data-dims-toggle]')) { st.dims = e.target.checked; $('[data-dims]').hidden = !st.dims; renderResult(); }
    if (e.target.matches('[data-ins-toggle]')) { st.ins = e.target.checked; $('[data-ins]').hidden = !st.ins; renderResult(); }
  });
  form.addEventListener('input', function (e) {
    if (e.target.matches('[data-weight]')) st.weight = num(e.target.value);
    if (e.target.matches('[data-dim]')) st.size = $$('[data-dim]').map(function (i) { return num(i.value); });
    if (e.target.matches('[data-value]')) st.value = num(e.target.value);
    renderResult();
  });

  /* ---------- Копирование (работает и без https) ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(function () { legacyCopy(text); });
    legacyCopy(text); return Promise.resolve();
  }
  function legacyCopy(text) {
    var ta = doc.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    doc.body.appendChild(ta); ta.select(); try { doc.execCommand('copy'); } catch (e) { /* пусто */ } ta.remove();
  }
  var toastT;
  function toast(html) { var t = $('[data-toast]'); t.innerHTML = html; t.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('is-on'); }, 4000); }

  /* ---------- Адрес склада ---------- */
  var codeInput = $('[data-code]');
  codeInput.value = store('code') || '';
  $('[data-code-prefix]').textContent = C.clientCodePrefix;
  function code() { return codeInput.value.trim().toUpperCase().replace(new RegExp('^' + C.clientCodePrefix.replace('-', '\\-?')), '') || '0000'; }
  function addrValue(f) { return f.value.replace('{code}', code()); }
  function renderAddr() {
    $('[data-addr]').innerHTML = C.warehouse.fields.map(function (f, i) {
      return '<div class="addr__row"><dt>' + esc(L(f.label)) + '</dt><dd>' + esc(addrValue(f)) + '</dd>' +
        '<button class="copy" type="button" data-copy="' + i + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg><span>' + D('copy') + '</span></button></div>';
    }).join('');
  }
  codeInput.addEventListener('input', function () { store('code', codeInput.value.trim()); renderAddr(); });
  $('[data-addr]').addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]'); if (!b) return;
    copyText(addrValue(C.warehouse.fields[+b.getAttribute('data-copy')]));
    b.classList.add('is-done'); b.querySelector('span').textContent = D('copied');
    setTimeout(function () { b.classList.remove('is-done'); b.querySelector('span').textContent = D('copy'); }, 1600);
  });
  $('[data-copy-all]').addEventListener('click', function () {
    copyText(C.warehouse.fields.map(function (f) { return L(f.label) + ': ' + addrValue(f); }).join('\n'));
    toast(esc(D('copiedAll')));
  });

  /* ---------- Отслеживание ---------- */
  $('[data-track]').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('#track-input'), c = input.value.trim().replace(/\s+/g, '');
    if (!c) { toast(esc(D('trackEmpty'))); input.focus(); return; }
    if (C.trackingUrl) { window.open(C.trackingUrl + encodeURIComponent(c), '_blank', 'noopener'); return; }
    copyText(c);
    window.open(links.bot, '_blank', 'noopener');
    toast(fill(D('trackCopied'), { code: esc(c) }));
  });

  /* ---------- Шапка, нижние кнопки, появление ---------- */
  var header = $('[data-header]'), dock = $('[data-dock]');
  // Нижние кнопки на телефоне — после того как форма отслеживания ушла с экрана
  function onScroll() {
    header.classList.toggle('is-scrolled', scrollY > 10);
    dock.classList.toggle('is-on', $('[data-track]').getBoundingClientRect().bottom < 0);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach(function (el) { io.observe(el); });
  } else $$('.rv').forEach(function (el) { el.classList.add('is-in'); });

  applyLang();
})();
