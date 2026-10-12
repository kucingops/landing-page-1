<script lang="ts">
	import LiveHero from '#lib/LiveHero.svelte';
	import InstallButton from '#lib/InstallButton.svelte';
	import { profile, projects, stack } from '#lib/profile.js';
	import { asset } from '$app/paths';

	const rules = [
		{
			value: '0',
			text: 'web fonts. Every glyph comes from your system, so text paints on the first frame.'
		},
		{
			value: '1',
			text: 'HTML file per page, prerendered at build time. No server, no database, no waiting.'
		},
		{ value: '≤ 50 KB', text: 'of JavaScript, gzipped. CI fails the build if a change goes over.' },
		{ value: 'Offline', text: 'after the first visit. A service worker caches the whole site.' }
	];
</script>

<svelte:head>
	<title>{profile.handle}, {profile.role.toLowerCase()}</title>
	<meta name="description" content={profile.intro} />
	<meta property="og:title" content={profile.handle} />
	<meta property="og:description" content={profile.intro} />
	<meta property="og:image" content={asset('icon-512.png')} />
</svelte:head>

<header class="wrap top">
	<a class="mark" href="#top" aria-label="{profile.handle}, back to top">
		<img src={asset('icon.svg')} alt="" width="28" height="28" />
		{profile.handle}
	</a>
	<nav aria-label="Sections">
		<a href="#work">Work</a>
		<a href="#how">How it's built</a>
		<a href="#contact">Contact</a>
	</nav>
</header>

<main id="top" class="wrap">
	<LiveHero />

	<section class="intro" aria-label="About">
		<p class="who">
			I'm {profile.name}, a {profile.role.toLowerCase()} based in {profile.location}.
			{profile.intro}
		</p>
		<div class="actions">
			<a class="primary" href="#work">See my work</a>
			<InstallButton />
		</div>
	</section>

	<section id="how" class="split" aria-labelledby="how-title">
		<h2 id="how-title">How it's built</h2>
		<div>
			<ul class="rules">
				{#each rules as rule (rule.value)}
					<li>
						<strong>{rule.value}</strong>
						<span>{rule.text}</span>
					</li>
				{/each}
			</ul>
			<p class="note">
				Every commit runs type checks, unit tests, browser tests and a Lighthouse audit before it
				can deploy. <a href={profile.source}>Read the source</a>.
			</p>
		</div>
	</section>

	<section id="work" class="split" aria-labelledby="work-title">
		<h2 id="work-title">Selected work</h2>
		<ol class="projects">
			{#each projects as p (p.name)}
				<li>
					<span class="year">{p.year}</span>
					<div>
						<h3>
							{#if p.href}<a href={p.href}>{p.name}</a>{:else}{p.name}{/if}
						</h3>
						<p>{p.summary}</p>
					</div>
					<p class="tags">{p.stack.join(', ')}</p>
				</li>
			{/each}
		</ol>
	</section>

	<section class="split" aria-labelledby="stack-title">
		<h2 id="stack-title">Tools I reach for</h2>
		<p class="stack">{stack.join(' / ')}</p>
	</section>

	<section id="contact" class="contact" aria-labelledby="contact-title">
		<h2 id="contact-title">Have something that needs to be fast?</h2>
		<a class="email" href="mailto:{profile.email}">{profile.email}</a>
	</section>
</main>

<footer class="wrap foot">
	<p>© {new Date().getFullYear()} {profile.handle}</p>
	<p>
		<a href={profile.github}>GitHub</a>
		<a href={profile.source}>Source</a>
	</p>
</footer>

<style>
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding-top: 1.25rem;
	}

	.mark {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		font-family: var(--display);
		font-weight: 700;
		font-size: var(--step-1);
		text-decoration: none;
		letter-spacing: -0.02em;
	}

	.mark img {
		border-radius: 7px;
	}

	nav {
		display: flex;
		gap: clamp(0.9rem, 3vw, 1.75rem);
		font-size: var(--step--1);
	}

	nav a {
		text-decoration: none;
		color: var(--muted);
	}

	nav a:hover {
		color: var(--ink);
	}

	@media (max-width: 34rem) {
		nav a:not([href='#contact']) {
			display: none;
		}
	}

	.intro {
		display: grid;
		gap: 1.5rem;
		padding-bottom: clamp(4rem, 10vh, 7rem);
	}

	.who {
		max-width: 38ch;
		font-size: var(--step-1);
		line-height: 1.45;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.25rem;
	}

	.primary {
		display: inline-block;
		padding: 0.7rem 1.15rem;
		border-radius: 999px;
		background: var(--signal);
		color: var(--paper);
		font-weight: 600;
		text-decoration: none;
		transition: transform 0.2s var(--ease-out);
	}

	.primary:hover {
		color: var(--paper);
		transform: translateY(-1px);
	}

	.split {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.25rem;
		padding-block: clamp(2.5rem, 6vh, 4rem);
		border-top: 1px solid var(--line);
	}

	@media (min-width: 52rem) {
		.split {
			grid-template-columns: 16rem minmax(0, 1fr);
			gap: 3rem;
		}
	}

	h2 {
		font-size: var(--step-1);
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.rules {
		display: grid;
		gap: 1.1rem;
	}

	.rules li {
		display: grid;
		grid-template-columns: 6.5rem minmax(0, 1fr);
		gap: 1rem;
		align-items: baseline;
		max-width: 44rem;
	}

	.rules strong {
		font-family: var(--display);
		font-size: var(--step-2);
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--signal);
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 34rem) {
		.rules li {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.2rem;
		}
	}

	.note {
		margin-top: 1.75rem;
		max-width: 40rem;
		color: var(--muted);
	}

	.projects li {
		display: grid;
		grid-template-columns: 3.5rem minmax(0, 1fr);
		gap: 0.25rem 1rem;
		padding-block: 1.1rem;
		border-bottom: 1px solid var(--line);
	}

	.projects li:first-child {
		padding-top: 0;
	}

	.year {
		color: var(--muted);
		font-variant-numeric: tabular-nums;
		padding-top: 0.15rem;
	}

	h3 {
		font-size: var(--step-1);
		font-weight: 600;
		line-height: 1.3;
	}

	.projects p {
		color: var(--muted);
		max-width: 52ch;
	}

	.tags {
		grid-column: 2;
		font-size: var(--step--1);
	}

	@media (min-width: 52rem) {
		.projects li {
			grid-template-columns: 3.5rem minmax(0, 1fr) 14rem;
		}
		.tags {
			grid-column: 3;
			text-align: right;
			padding-top: 0.3rem;
		}
	}

	.stack {
		font-size: var(--step-1);
		max-width: 40ch;
	}

	.contact {
		padding-block: clamp(4rem, 12vh, 8rem);
		border-top: 1px solid var(--line);
	}

	.contact h2 {
		font-size: var(--step-2);
		font-weight: 400;
		max-width: 22ch;
		line-height: 1.2;
	}

	.email {
		display: inline-block;
		margin-top: 1rem;
		font-family: var(--display);
		font-size: clamp(1.75rem, 7vw, 4rem);
		font-weight: 700;
		letter-spacing: -0.035em;
		color: var(--signal);
		text-decoration: none;
		overflow-wrap: anywhere;
	}

	.email:hover {
		text-decoration: underline;
		text-decoration-thickness: 3px;
	}

	.foot {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding-block: 1.5rem 2.5rem;
		border-top: 1px solid var(--line);
		color: var(--muted);
		font-size: var(--step--1);
	}

	.foot p:last-child {
		display: flex;
		gap: 1.25rem;
	}
</style>
