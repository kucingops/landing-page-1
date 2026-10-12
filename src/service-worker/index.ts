import { self } from '$app/service-worker';
import { version } from '$app/env';
import { immutable, assets, prerendered } from '$app/manifest';
import { resolve } from '$app/paths';

const CACHE = `kucingops-${version}`;

// Build output, static files and every prerendered page: the whole site
// is precached on install, so a second visit works with no network at all.
const PRECACHE = [
	...immutable.map((f) => resolve(f.path)),
	...assets.map((f) => resolve(f.path)),
	...prerendered.map((f) => resolve(f.path))
];
const PRECACHED = new Set(PRECACHE);

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(PRECACHE))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
			await self.clients.claim();
		})()
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);

			// Hashed build files and static assets never change for a given version.
			if (PRECACHED.has(url.pathname) && request.mode !== 'navigate') {
				const hit = await cache.match(url.pathname);
				if (hit) return hit;
			}

			// Pages: network first so a deploy shows up immediately, cache when offline.
			try {
				const response = await fetch(request);
				if (response.ok && response.type === 'basic') void cache.put(request, response.clone());
				return response;
			} catch (error) {
				const hit =
					(await cache.match(request, { ignoreSearch: true })) ??
					(request.mode === 'navigate' ? await cache.match(resolve('/')) : undefined);
				if (hit) return hit;
				throw error;
			}
		})()
	);
});
