/* Keeps the app working offline. Bump VERSION to make every device pick up a new release. */
const VERSION = 'kbju-v22';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(VERSION).then(async c => (await c.match(req)) || fetch(req).then(res => { c.put(req, res.clone()); return res; })));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // Show the saved copy at once, refresh it in the background: updates appear on the next launch.
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(caches.open(VERSION).then(async c => {
    const cached = await c.match(key, { ignoreSearch: true });
    const net = fetch(req, { cache: 'no-cache' }).then(res => { if (res.ok) c.put(key, res.clone()); return res; });
    if (cached) { e.waitUntil(net.catch(() => {})); return cached; }
    return net;
  }));
});
