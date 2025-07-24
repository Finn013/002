const CACHE_NAME = '013-todo-v1';
const CACHE_FILES = [
  './013.html',
  './manifest.json',
  // Добавьте сюда иконки и css/js если есть
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Если ресурс есть в кэше, возвращаем его.
      // Если нет - возвращаем пустой ответ с ошибкой.
      return response || new Response(null, { status: 404 });
    })
  );
});

