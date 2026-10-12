// Placeholder profile. Swap these for your own details; the page reads everything from here.

export const profile = {
	handle: 'kucingops',
	name: 'Kucing Ops',
	role: 'Web engineer',
	intro: 'I build web apps that feel instant, and I measure them to prove it.',
	location: 'Indonesia',
	email: 'hello@kucingops.dev',
	github: 'https://github.com/kucingops',
	source: 'https://github.com/kucingops/landing-page-1'
};

export interface Project {
	name: string;
	summary: string;
	stack: string[];
	year: number;
	href?: string;
}

export const projects: Project[] = [
	{
		name: 'This page',
		summary: 'A prerendered, offline-capable portfolio that reports its own load time.',
		stack: ['SvelteKit', 'Service worker', 'GitHub Actions'],
		year: 2026,
		href: 'https://github.com/kucingops/landing-page-1'
	},
	{
		name: 'Project two',
		summary: 'One sentence on what it does and who it is for.',
		stack: ['Svelte', 'Elysia', 'Bun'],
		year: 2026
	},
	{
		name: 'Project three',
		summary: 'One sentence on the hardest problem you solved in it.',
		stack: ['TypeScript', 'PostgreSQL'],
		year: 2025
	}
];

export const stack = ['Svelte 5', 'SvelteKit', 'Elysia', 'Bun', 'TypeScript', 'Playwright'];
