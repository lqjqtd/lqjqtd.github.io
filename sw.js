const VERSION = '20260723055643';
const CACHE_NAME = 'site-cache-v' + VERSION;

// 核心资产：包含你的模块化 JS 文件
const ASSETS = [
  './',
  './css/styles.css',
  './js/app.js',
  './js/modules/state.js',
  './js/modules/i18n.js',
  './js/modules/pwa.js',
  './js/modules/loader.js',
  './js/modules/studio.js',
  './favicon.svg'
];

// 需要加版本号做 cache-busting 的文件后缀
const VERSIONED_EXT = ['.css', '.js', '.svg'];

function versionedUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    if (u.origin !== self.location.origin) return urlStr;
    const path = u.pathname;
    for (const ext of VERSIONED_EXT) {
      if (path.endsWith(ext)) {
        u.searchParams.set('v', VERSION);
        return u.toString();
      }
    }
    return urlStr;
  } catch (e) {
    return urlStr;
  }
}

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
          cache.add(versionedUrl(url)).catch((err) => console.warn('Precache failed:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 运行时策略：StaleWhileRevalidate + 版本号 cache-busting
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const reqUrl = event.request.url;
  const cacheKey = versionedUrl(reqUrl);
  const useCacheKey = cacheKey !== reqUrl;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. 尝试从缓存获取（用带版本号的 key）
      const cachedResponse = useCacheKey
        ? await cache.match(cacheKey)
        : await cache.match(event.request);

      // 2. 后台更新（也用带版本号的 URL 请求和缓存）
      const networkReq = useCacheKey ? new Request(cacheKey) : event.request;
      const fetchPromise = fetch(networkReq).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(cacheKey, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => { });

      // 3. 如果是导航请求且缓存中没找到，回退到 index.html
      if (event.request.mode === 'navigate' && !cachedResponse) {
        return cache.match(versionedUrl('./index.html')).then(res => res || fetchPromise);
      }

      // 4. 返回缓存或等待网络结果
      return cachedResponse || fetchPromise;
    })
  );
});
