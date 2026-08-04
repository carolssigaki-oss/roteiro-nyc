// Service Worker do Guia NYC — garante que o guia funcione 100% offline
// depois da primeira vez que for aberto com internet.

const CACHE_NAME = "guia-nyc-v2";
const CACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

// Na instalação, guarda o guia no cache do dispositivo.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_URLS))
  );
  self.skipWaiting();
});

// Remove caches antigos de versões anteriores, se houver.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Estratégia: tenta a rede primeiro (pra pegar atualizações), mas se não
// tiver internet, usa o que está guardado no cache — é isso que garante
// o funcionamento offline.
self.addEventListener("fetch", (event) => {
  // Só intercepta pedidos de mesma origem (o guia em si). Links externos
  // (Google Maps, Instagram) seguem o caminho normal do navegador.
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
