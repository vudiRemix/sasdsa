/* ==========================================================================
   НАСТРОЙКИ МАГАЗИНА
   Название, контакты, меню, условия доставки и оплаты.
   Чтобы переделать сайт под клиента — начните с этого файла.
   ========================================================================== */
window.SHOP_CONFIG = {
  brand: {
    name: 'обиход',                 // слово в логотипе и большой надписи в футере
    legalName: 'ИП Смирнова А. В.', // юрлицо в подвале
    inn: '770000000000',
    tagline: 'Вещи для дома от небольших мастерских',
    showMark: true,                 // знак-пиала слева от названия
    year: 2026
  },

  contacts: {
    phone: '+7 (495) 120-45-67',
    phoneHref: '+74951204567',
    email: 'hello@obikhod.shop',
    address: 'Москва, Новослободская, 16А, шоурум на 2 этаже',
    hours: 'Ежедневно 11:00–21:00',
    socials: [
      { name: 'Telegram', url: 'https://t.me/' },
      { name: 'ВКонтакте', url: 'https://vk.com/' },
      { name: 'Пинтерест', url: 'https://pinterest.com/' }
    ]
  },

  // Плашка над шапкой
  promo: 'Бесплатная доставка от 7 000 ₽ · Возврат 14 дней · <a href="delivery.html">Подробнее</a>',

  // Основное меню (слева в шапке). «Каталог» с выпадающим меню добавляется автоматически.
  nav: [
    { label: 'Новинки', href: 'catalog.html?sort=new' },
    { label: 'Мастерские', href: 'about.html' },
    { label: 'Доставка', href: 'delivery.html' }
  ],

  // Колонки ссылок в подвале
  footer: [
    { title: 'Покупателям', links: [
      { label: 'Доставка и оплата', href: 'delivery.html' },
      { label: 'Возврат и обмен', href: 'delivery.html#return' },
      { label: 'Вопросы и ответы', href: 'delivery.html#faq' },
      { label: 'Подарочные сертификаты', href: 'catalog.html' }
    ] },
    { title: 'Обиход', links: [
      { label: 'О магазине', href: 'about.html' },
      { label: 'Мастерские', href: 'about.html#makers' },
      { label: 'Стать поставщиком', href: 'about.html#join' },
      { label: 'Шоурум', href: 'delivery.html#pickup' }
    ] }
  ],

  currency: '₽',
  locale: 'ru-RU',

  // Доставка: порог бесплатной доставки и способы (используются в корзине,
  // карточке товара и оформлении заказа)
  freeShippingFrom: 7000,
  shipping: [
    { id: 'courier', title: 'Курьером', desc: 'По Москве и Петербургу, завтра с 10 до 22', price: 390, eta: 'завтра', icon: 'truck', needsAddress: true },
    { id: 'cdek',    title: 'В пункт выдачи СДЭК', desc: 'Больше 4 000 пунктов по России, 2–5 дней', price: 290, eta: '2–5 дней', icon: 'box', needsAddress: true },
    { id: 'post',    title: 'Почтой России', desc: 'В любой населённый пункт, 5–12 дней', price: 350, eta: '5–12 дней', icon: 'mail', needsAddress: true },
    { id: 'pickup',  title: 'Самовывоз из шоурума', desc: 'Новослободская, 16А — в день заказа после 15:00', price: 0, eta: 'сегодня', icon: 'pin', needsAddress: false }
  ],

  payment: [
    { id: 'card',  title: 'Картой онлайн', desc: 'Мир, Visa, Mastercard' },
    { id: 'sbp',   title: 'СБП', desc: 'По QR-коду из приложения банка' },
    { id: 'split', title: 'Частями', desc: '4 платежа без переплаты, первый — сегодня' },
    { id: 'cash',  title: 'При получении', desc: 'Картой или наличными курьеру' }
  ],

  // Промокоды: код → скидка (доля от суммы товаров)
  promoCodes: { 'ОБИХОД10': 0.10, 'OBIKHOD10': 0.10, 'ПЕРВЫЙ': 0.05 },

  // Куда отправлять заказ. Пусто — демо-режим (заказ просто показывается как оформленный).
  // Можно указать адрес Formspree, Google Apps Script или своего сервера — придёт POST с JSON.
  orderEndpoint: '',
  // То же для подписки на рассылку
  subscribeEndpoint: '',

  // Где лежат фото товаров. Имена файлов: <id>.webp, <id>-sm.webp, <id>-detail.webp, <id>-full.webp
  productImagePath: 'assets/img/products/',

  storageKey: 'obikhod'            // префикс для localStorage (корзина, избранное)
};
