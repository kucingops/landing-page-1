/// <reference types="vitest/config" />
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// GitHub Pages serves a project site from /<repo-name>. CI sets BASE_PATH;
// locally it stays empty so `bun dev` works at the root.
const base = (process.env.BASE_PATH ?? '') as '' | `/${string}`;

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ pages: 'build', assets: 'build', fallback: '404.html', strict: true }),
			paths: { base, relative: true },
			prerender: { handleHttpError: 'fail' },
			inlineStyleThreshold: 8192
		})
	],
	build: { target: 'es2022', cssMinify: 'lightningcss' },
	test: { include: ['src/**/*.test.ts'] }
});
