// Serves ./build under BASE_PATH exactly like GitHub Pages does, for e2e tests and Lighthouse.
const base = process.env.BASE_PATH ?? '';
const port = Number(process.env.PORT ?? 4173);

const types: Record<string, string> = { webmanifest: 'application/manifest+json' };

Bun.serve({
	port,
	async fetch(req) {
		const url = new URL(req.url);
		if (!url.pathname.startsWith(base + '/') && url.pathname !== base) {
			return new Response('Not found', { status: 404 });
		}
		let path = decodeURIComponent(url.pathname.slice(base.length)) || '/';
		if (path.endsWith('/')) path += 'index.html';
		const file = Bun.file(`build${path}`);
		if (!(await file.exists())) {
			return new Response(Bun.file('build/404.html'), {
				status: 404,
				headers: { 'content-type': 'text/html' }
			});
		}
		const ext = path.split('.').pop() ?? '';
		const headers: Record<string, string> = {};
		if (types[ext]) headers['content-type'] = types[ext];
		if (path.includes('/_app/immutable/'))
			headers['cache-control'] = 'public, max-age=31536000, immutable';
		return new Response(file, { headers });
	}
});

console.log(`Serving build at http://localhost:${port}${base}/`);
