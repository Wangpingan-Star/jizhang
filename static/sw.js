const CACHE_NAME = 'ledger-v2'

const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './static/sqljs/sql-wasm.js',
    './static/sqljs/sql-wasm.wasm',
    './static/logo.png',
    './static/icon-ledger.png',
    './static/icon-ledger-active.png',
    './static/icon-stats.png',
    './static/icon-stats-active.png'
]

// 安装：预缓存核心文件
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] 预缓存中...')
            return cache.addAll(PRECACHE_URLS)
        }).then(() => {
            console.log('[SW] 预缓存完成')
            return self.skipWaiting()
        })
    )
})

// 激活：清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            )
        }).then(() => self.clients.claim())
    )
})

// 请求拦截：缓存优先，网络兜底
self.addEventListener('fetch', event => {
    // 跳过 API 请求（邮件发送等）
    if (event.request.url.includes('/api/')) return

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached

            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response
                }
                const clone = response.clone()
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, clone)
                })
                return response
            }).catch(() => {
                // 离线且无缓存，返回首页
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html')
                }
            })
        })
    )
})
