<script lang="ts">
	import { onMount } from 'svelte';
	import {
		formatBytes,
		formatCls,
		formatMs,
		formatSeconds,
		observeVitals,
		rate,
		type Metric,
		type Readings
	} from './vitals';

	let readings = $state<Readings>({});
	let shown = $state<number | null>(null);
	let offline = $state<'checking' | 'ready' | 'unsupported'>('checking');

	const rows: { key: Metric; label: string; hint: string }[] = [
		{ key: 'ttfb', label: 'Server response', hint: 'Time to first byte' },
		{ key: 'fcp', label: 'First paint', hint: 'First contentful paint' },
		{ key: 'lcp', label: 'Largest paint', hint: 'Largest contentful paint' },
		{ key: 'cls', label: 'Layout shift', hint: 'Cumulative layout shift' }
	];

	function settle(target: number) {
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduce) return void (shown = target);
		const start = performance.now();
		const duration = 900;
		const tick = (now: number) => {
			// rAF timestamps can predate `start`; clamp so the first frame never goes negative.
			const t = Math.min(1, Math.max(0, (now - start) / duration));
			shown = target * (1 - Math.pow(1 - t, 4));
			if (t < 1) requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	}

	onMount(() => {
		let settled = false;
		const stop = observeVitals((r) => {
			readings = r;
			if (!settled && r.load !== undefined) {
				settled = true;
				settle(r.load);
			}
		});

		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.ready.then(() => (offline = 'ready'));
		} else {
			offline = 'unsupported';
		}
		return stop;
	});

	const value = (key: Metric) => {
		const v = readings[key];
		if (v === undefined) return null;
		return { text: key === 'cls' ? formatCls(v) : formatMs(v), rating: rate(key, v) };
	};
</script>

<section class="hero" aria-labelledby="hero-title">
	<h1 id="hero-title">
		<span class="lead">This page finished loading in</span>
		<span class="visually-hidden">
			{readings.load === undefined ? 'measuring' : `${formatSeconds(readings.load)} seconds`}
		</span>
		<span class="number" aria-hidden="true">
			<span class="digits" class:pending={shown === null}
				>{shown === null ? '0.00' : formatSeconds(shown)}</span
			><span class="unit">s</span>
		</span>
		<span class="lead">
			{readings.fromCache ? 'from your offline cache, just now.' : 'on your device, just now.'}
		</span>
	</h1>

	<dl class="readings">
		{#each rows as row (row.key)}
			{@const v = value(row.key)}
			<div class="reading" title={row.hint}>
				<dt>{row.label}</dt>
				<dd>
					{#if v}
						<span class="dot {v.rating}" aria-hidden="true"></span>{v.text}
						<span class="visually-hidden">({v.rating})</span>
					{:else}
						<span class="na">{row.key === 'lcp' ? 'Not reported' : '…'}</span>
					{/if}
				</dd>
			</div>
		{/each}
		<div class="reading">
			<dt>Transferred</dt>
			<dd>
				{#if readings.transferred !== undefined}
					{formatBytes(readings.transferred)}
				{:else}
					<span class="na">…</span>
				{/if}
				<!-- Always rendered, so the row height is fixed before the numbers arrive. -->
				<span class="sub">
					{readings.requests === undefined ? '\u00a0' : `in ${readings.requests} requests`}
				</span>
			</dd>
		</div>
		<div class="reading">
			<dt>Offline</dt>
			<dd>
				{#if offline === 'ready'}
					<span class="dot good" aria-hidden="true"></span>Ready
				{:else if offline === 'unsupported'}
					<span class="na">Not supported</span>
				{:else}
					<span class="na">Caching…</span>
				{/if}
			</dd>
		</div>
	</dl>
</section>

<style>
	.hero {
		padding-block: clamp(3rem, 10vh, 7rem) clamp(2.5rem, 6vh, 4.5rem);
	}

	h1 {
		display: flex;
		flex-direction: column;
		font-weight: 400;
	}

	.lead {
		font-size: clamp(1.3rem, 4.6vw, var(--step-2));
		line-height: 1.2;
		letter-spacing: -0.01em;
		max-width: 24ch;
	}

	.number {
		display: flex;
		align-items: baseline;
		gap: 0.08em;
		margin-block: 0.02em 0.06em;
		font-family: var(--display);
		font-size: clamp(5.5rem, 26vw, 16rem);
		font-weight: 800;
		line-height: 0.9;
		letter-spacing: -0.055em;
		color: var(--signal);
		font-variant-numeric: tabular-nums;
	}

	.digits {
		/* Tabular digits keep every frame of the count-up the same width: no layout shift. */
		display: inline-block;
		transition: opacity 0.4s var(--ease-out);
	}

	.digits.pending {
		opacity: 0.18;
	}

	.unit {
		font-size: 0.42em;
		font-weight: 600;
		letter-spacing: 0;
	}

	.readings {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
		margin-top: clamp(2rem, 5vh, 3.5rem);
		border-top: 1px solid var(--line);
	}

	.reading {
		padding: 0.9rem 1rem 0.9rem 0;
		border-bottom: 1px solid var(--line);
	}

	dt {
		color: var(--muted);
		font-size: var(--step--1);
	}

	dd {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0 0.45rem;
		min-height: 1.6em;
		font-size: var(--step-1);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.sub {
		flex-basis: 100%;
	}

	.sub {
		color: var(--muted);
		font-size: var(--step--1);
		font-weight: 400;
	}

	/* Same size as a real value, so swapping it in never changes the row height. */
	.na {
		color: var(--muted);
		font-weight: 400;
	}

	.dot {
		align-self: center;
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
		margin-right: -0.1rem;
	}

	.dot.good {
		background: var(--good);
	}
	.dot.ok {
		background: var(--ok);
	}
	.dot.poor {
		background: var(--poor);
	}
</style>
