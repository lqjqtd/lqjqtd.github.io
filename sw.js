const VERSION = '20260723041237';
const CACHE_NAME = 'site-cache-v' + VERSION;

// 核心资产：包含你的模块化 JS 文件
const V = '?v=' + VERSION;
const ASSETS = [
  './',
  './css/styles.css' + V,
  './js/app.js' + V,
  './js/modules/state.js' + V,
  './js/modules/i18n.js' + V,
  './js/modules/pwa.js' + V,
  './js/modules/loader.js' + V,
  './js/modules/studio.js' + V,
  './favicon.svg' + V
];

// 0. 接收跳过等待消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 1. 安装阶段
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn('Precache failed:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. 激活阶段：清理旧缓�?self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 运行时策略：适配 SPA �?StaleWhileRevalidate
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. 尝试从缓存获�?      const cachedResponse = await cache.match(event.request);

      // 2. 后台更新逻辑
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => { });

      // 3. 如果是导航请求且缓存中没找到，回退�?index.html
      if (event.request.mode === 'navigate' && !cachedResponse) {
        return cache.match('./index.html').then(res => res || fetchPromise);
      }

      // 4. 返回缓存或等待网络结�?      return cachedResponse || fetchPromise;
    })
  );
});