// Fails when the shipped JavaScript or CSS goes over budget (gzipped).
// Runs in CI after `bun run build`.
import { Glob, gzipSync } from 'bun';

const BUDGET = { js: 50 * 1024, css: 12 * 1024, html: 20 * 1024 };

const totals = { js: 0, css: 0, html: 0 };
for await (const path of new Glob('build/**/*.{js,css,html}').scan('.')) {
	const ext = path.split('.').pop() as keyof typeof totals;
	if (path.endsWith('service-worker.js')) continue; // not on the critical path
	totals[ext] += gzipSync(await Bun.file(path).bytes()).byteLength;
}

let failed = false;
for (const key of Object.keys(BUDGET) as (keyof typeof BUDGET)[]) {
	const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
	const over = totals[key] > BUDGET[key];
	failed ||= over;
	console.log(
		`${over ? '✗' : '✓'} ${key.padEnd(4)} ${kb(totals[key]).padStart(9)} / ${kb(BUDGET[key])}`
	);
}
if (failed) {
	console.error('\nOver budget. Trim the bundle or raise the budget on purpose.');
	process.exit(1);
}
