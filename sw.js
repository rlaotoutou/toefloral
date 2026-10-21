// 离线缓存：有网时总是取最新文件（这样你每周更新的 data.json 会马上生效），没网时用上次缓存的版本。
const V = "toefl-v4";
const CORE = ["./", "index.html", "data.enc.json", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const save = res => { const copy = res.clone(); caches.open(V).then(c => c.put(e.request, copy)); return res; };
  if (url.origin !== location.origin) {
    // 字体等外部文件：先用缓存，没有再下载
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(save)));
    return;
  }
  // 本站文件：先联网取最新，失败再用缓存
  e.respondWith(
    fetch(e.request).then(save).catch(() =>
      caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html"))
    )
  );
});
