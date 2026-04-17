// 缓存名称
const CACHE_NAME = 'lifemanager-v2';

// 需要缓存的本地资源（相对路径，自动适配部署路径）
const STATIC_ASSETS = [
  './',
  './index.html',
  './config/config.js',
  './utils/utils.js',
  './data/dataManager.js',
  './export/exportManager.js',
  './charts/chartManager.js',
  './ui/uiManager.js',
  './app.js',
  './manifest.json',
  './icon.svg'
];

// 外部CDN资源（用于离线缓存）
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.8/chart.umd.min.js'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 缓存本地资源');
        return cache.addAll(STATIC_ASSETS).then(() => {
          console.log('[SW] 尝试缓存CDN资源（可能因跨域失败，不影响使用）');
          // CDN资源可能因CORS限制无法缓存，单独处理错误
          return Promise.allSettled(
            CDN_ASSETS.map(url => cache.add(url))
          );
        });
      })
      .catch(err => {
        console.log('[SW] 预缓存部分资源失败:', err);
      })
  );
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((cacheName) => {
            return cacheName !== CACHE_NAME;
          }).map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
  );
  self.clients.claim();
});

// 拦截网络请求 - Cache First 策略
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 只处理同源请求和已知CDN请求
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isKnownCDN = CDN_ASSETS.some(cdn => event.request.url.startsWith(cdn.replace(/[^/]+$/, '')));

  if (!isSameOrigin && !isKnownCDN) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          // 网络失败时返回离线页面（如果有的话）
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});