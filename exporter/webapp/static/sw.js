const CACHE_NAME = 'dpd-pwa-v1';
const urlsToCache = [
  // Основные страницы
  '/',
  '/ru/',

  // Критические CSS/JS
  '/static/dpd.js',
  '/static/autopali.js',
  '/static/home.js',
  '/static/extra.js',
  '/static/dpd.css',
  '/static/home.css',
  '/static/extrastyles.css',
 
  // Иконки и ассеты
  '/static/dpd.ico',

  // Данные словаря (если они статические)
  '/static/sutta_words.txt'
];

// Установка и кеширование
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Стратегия: "Сначала кеш, потом сеть"
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Очистка старых кешей
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(
        keys.map((key) => 
          key !== CACHE_NAME ? caches.delete(key) : null
        )
      )
    )
  );
});