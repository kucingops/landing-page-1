// Renders the PNG app icons from the SVG sources in /static.
// Run after editing icon.svg or icon-maskable.svg:  bun scripts/icons.ts
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const jobs = [
	{ src: 'static/icon.svg', out: 'static/icon-192.png', size: 192 },
	{ src: 'static/icon.svg', out: 'static/icon-512.png', size: 512 },
	{ src: 'static/icon-maskable.svg', out: 'static/icon-maskable-512.png', size: 512 }
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
for (const { src, out, size } of jobs) {
	const svg = await readFile(src, 'utf8');
	await page.setViewportSize({ width: size, height: size });
	await page.setContent(
		`<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`
	);
	await page.screenshot({ path: out, omitBackground: true });
	console.log(`${out} (${size}px)`);
}
await browser.close();
