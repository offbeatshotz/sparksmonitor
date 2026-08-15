const CACHE_NAME = 'spark-tracker-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './output.css',
  './style.css',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/tesseract.js@v4.0.1/dist/tesseract.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
