const CACHE='vesper-__BUILD__';
const FILES=['./','./index.html','./style.css?v=__BUILD__','./engine.js?v=__BUILD__','./renderer.js?v=__BUILD__','./game.js?v=__BUILD__','./boot.js?v=__BUILD__','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('message',e=>{if(e.data?.type==='ACTIVATE')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('vesper-')&&k!==CACHE)await caches.delete(k);await self.clients.claim();})()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;if(e.request.mode==='navigate'){e.respondWith((async()=>{try{const r=await fetch(e.request);if(r.ok){const c=await caches.open(CACHE);await c.put('./index.html',r.clone());}return r;}catch{return await caches.match('./index.html')||Response.error();}})());}else e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
