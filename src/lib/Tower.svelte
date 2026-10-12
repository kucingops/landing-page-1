<script lang="ts">
	import { onMount } from 'svelte';
	import {
		FLOOR_HEIGHT as H,
		MAX_FLOORS,
		WINDOW_X,
		floor,
		grow,
		visibleRange,
		type Floor
	} from './tower';

	const SIGNS = ['MEOW', 'OPEN', 'BUN', 'NOMS'];
	const JUMP = 10_000;

	let scroller: HTMLDivElement;
	let top = $state(0);
	let viewport = $state(480);
	let total = $state(60);
	let fps = $state<number | null>(null);
	let reduceMotion = $state(false);

	const range = $derived(visibleRange(top, viewport, total));
	const floors = $derived.by(() => {
		const out: Floor[] = [];
		for (let i = range.first; i <= range.last; i++) out.push(floor(i));
		return out;
	});
	const current = $derived(Math.floor((top + viewport / 2) / H));
	const step = $derived(reduceMotion ? 0 : Math.floor(top / 26) % 2);

	// While scrolling, read the position once per frame (never per scroll event) and count frames.
	let running = false;
	let idleAt = 0;
	let frames = 0;
	let windowStart = 0;

	function frame(now: number) {
		top = scroller.scrollTop;
		total = grow(total, top, viewport);
		frames++;
		if (now - windowStart >= 500) {
			fps = Math.round((frames * 1000) / (now - windowStart));
			frames = 0;
			windowStart = now;
		}
		if (now < idleAt) requestAnimationFrame(frame);
		else running = false;
	}

	function onScroll() {
		idleAt = performance.now() + 250;
		if (running) return;
		running = true;
		frames = 0;
		windowStart = performance.now();
		requestAnimationFrame(frame);
	}

	function jump() {
		const target = Math.min(MAX_FLOORS - 3, current + JUMP);
		total = Math.max(total, target + 60);
		// Let the taller spacer render before moving there.
		requestAnimationFrame(() => (scroller.scrollTop = target * H));
	}

	onMount(() => {
		reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const ro = new ResizeObserver(([entry]) => (viewport = entry.contentRect.height));
		ro.observe(scroller);
		return () => ro.disconnect();
	});
</script>

<div class="tower-block">
	<dl class="stats">
		<div>
			<dt>You are on</dt>
			<dd>{current === 0 ? 'the roof' : `floor ${current.toLocaleString('en')}`}</dd>
		</div>
		<div>
			<dt>Floors in the page</dt>
			<dd>{floors.length} <span>of {total.toLocaleString('en')} built</span></dd>
		</div>
		<div>
			<dt>Scroll frame rate</dt>
			<dd>{fps === null ? 'Scroll to measure' : `${fps} fps`}</dd>
		</div>
	</dl>

	<div class="frame">
		<!-- Scrollable regions need to be focusable so keyboard users can scroll them. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			class="scroller"
			bind:this={scroller}
			onscroll={onScroll}
			tabindex="0"
			role="region"
			aria-label="Tower drawing. Scroll to climb down."
		>
			<div class="spacer" style:height="{total * H}px">
				{#each floors as f (f.index)}
					<div
						class="floor"
						class:roof={f.index === 0}
						style:transform="translateY({f.index * H}px)"
					>
						<svg viewBox="0 0 400 360" width="400" height="360" aria-hidden="true">
							{#if f.index === 0}
								<circle cx="86" cy="86" r="34" fill="#f5edd0" />
								<circle cx="100" cy="78" r="30" fill="var(--sky)" />
								<path
									d="M232 300V150m0 0-26 40m26-40 26 40M232 200h-18m18 24h26"
									stroke="#3a4878"
									stroke-width="4"
									fill="none"
									stroke-linecap="round"
								/>
								<circle cx="232" cy="146" r="5" fill="#ff6b8b" />
								<rect x="-2000" y="300" width="4400" height="60" fill="var(--wall)" />
								<rect x="-2000" y="296" width="4400" height="10" rx="2" fill="var(--ledge)" />
							{:else}
								{#if f.pipe}
									<path d="M16 0v360" stroke="var(--ledge)" stroke-width="8" />
								{/if}
								{#if f.sign}
									<g transform="translate(110 46)">
										<rect
											width="96"
											height="34"
											rx="8"
											fill="none"
											stroke="#ff6b8b"
											stroke-width="3"
										/>
										<text
											x="48"
											y="23"
											text-anchor="middle"
											fill="#ff9db3"
											font-size="17"
											font-weight="700"
											font-family="ui-rounded, system-ui, sans-serif"
											letter-spacing="2">{SIGNS[f.index % SIGNS.length]}</text
										>
									</g>
								{/if}
								{#each f.windows as w, i (i)}
									{@const x = WINDOW_X[i]}
									<g transform="translate({x} 112)">
										<rect x="-6" y="-6" width="116" height="168" rx="4" fill="var(--ledge)" />
										<rect
											width="104"
											height="156"
											fill={w.lit ? `hsl(${w.hue} 96% 68%)` : 'var(--glass)'}
										/>
										{#if w.resident === 'cat'}
											<g fill="var(--silhouette)" transform="translate({i % 2 ? 58 : 18} 92)">
												<ellipse cx="18" cy="48" rx="18" ry="16" />
												<circle cx="18" cy="24" r="12" />
												<path d="M8 18 6 4l10 9m10-1 4-12-14 13" />
												<path
													d="M34 56c14 0 16-16 8-22"
													stroke="var(--silhouette)"
													stroke-width="5"
													fill="none"
													stroke-linecap="round"
												/>
											</g>
										{:else if w.resident === 'plant'}
											<g transform="translate({i % 2 ? 62 : 16} 96)" fill="#1d3b33">
												<ellipse cx="14" cy="18" rx="8" ry="20" transform="rotate(-25 14 18)" />
												<ellipse cx="26" cy="14" rx="8" ry="22" transform="rotate(20 26 14)" />
												<ellipse cx="20" cy="10" rx="6" ry="20" />
												<path d="M8 36h26l-4 24H12Z" fill="var(--silhouette)" />
											</g>
										{:else if w.resident === 'lamp'}
											<g transform="translate({i % 2 ? 64 : 20} 64)" fill="var(--silhouette)">
												<path d="M2 26 10 0h16l8 26Z" opacity=".85" />
												<rect x="16" y="26" width="4" height="56" />
												<rect x="6" y="82" width="24" height="10" rx="2" />
											</g>
										{:else if w.resident === 'curtain'}
											<path
												d="M0 0h40c-6 40 4 100-6 156H0Zm104 0H64c6 40-4 100 6 156h34Z"
												fill="var(--silhouette)"
												opacity=".55"
											/>
										{/if}
										<path d="M52 0v156M0 70h104" stroke="var(--ledge)" stroke-width="5" />
									</g>
								{/each}
								<rect x="-2000" y="342" width="4400" height="18" fill="var(--ledge)" />
							{/if}
							<!-- Fire escape: rails run through every floor so the ladder never breaks. -->
							{#if f.index > 0}
								<path d="M304 0v360M344 0v360" stroke="var(--rail)" stroke-width="5" />
								<path
									d="M304 15h40M304 45h40M304 75h40M304 105h40M304 135h40M304 165h40M304 195h40M304 225h40M304 255h40M304 285h40M304 315h40M304 345h40"
									stroke="var(--rail)"
									stroke-width="3"
								/>
							{:else}
								<path
									d="M304 300v60M344 300v60M304 315h40M304 345h40"
									stroke="var(--rail)"
									stroke-width="5"
								/>
								<path d="M304 330h40" stroke="var(--rail)" stroke-width="3" />
							{/if}
						</svg>
					</div>
				{/each}
			</div>
		</div>

		<!-- The climber never moves; the world scrolls past it. Only its pose changes. -->
		<svg class="climber" viewBox="0 0 64 72" width="64" height="72" aria-hidden="true">
			<g fill="#eef1f6">
				<path
					d={step ? 'M14 28 6 6' : 'M14 28 8 40'}
					stroke="#eef1f6"
					stroke-width="8"
					stroke-linecap="round"
				/>
				<path
					d={step ? 'M50 28 56 40' : 'M50 28 58 6'}
					stroke="#eef1f6"
					stroke-width="8"
					stroke-linecap="round"
				/>
				<path
					d={step ? 'M22 56 18 70' : 'M22 56 12 50'}
					stroke="#eef1f6"
					stroke-width="8"
					stroke-linecap="round"
				/>
				<path
					d={step ? 'M42 56 52 50' : 'M42 56 46 70'}
					stroke="#eef1f6"
					stroke-width="8"
					stroke-linecap="round"
				/>
				<rect x="14" y="20" width="36" height="40" rx="14" />
				<path d="M14 22V4l12 10h12L50 4v18Z" />
				<path
					d="M44 58c10 4 14 10 8 14"
					stroke="#eef1f6"
					stroke-width="5"
					fill="none"
					stroke-linecap="round"
				/>
			</g>
		</svg>

		<button type="button" class="jump" onclick={jump}
			>Jump {JUMP.toLocaleString('en')} floors down</button
		>
	</div>
</div>

<style>
	.tower-block {
		--sky: #0d1530;
		--wall: #18213a;
		--ledge: #26314f;
		--glass: #0f1629;
		--rail: #4a5c94;
		--silhouette: #1a1f33;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		border-top: 1px solid var(--line);
		margin-bottom: 1rem;
	}

	.stats div {
		padding: 0.75rem 1rem 0.75rem 0;
		border-bottom: 1px solid var(--line);
	}

	dt {
		color: var(--muted);
		font-size: var(--step--1);
	}

	dd {
		font-size: var(--step-1);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	dd span {
		color: var(--muted);
		font-size: var(--step--1);
		font-weight: 400;
	}

	.frame {
		position: relative;
		height: min(70vh, 34rem);
		border-radius: 20px;
		overflow: hidden;
		background: var(--wall);
		isolation: isolate;
	}

	.scroller {
		height: 100%;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		scrollbar-color: var(--rail) transparent;
	}

	.scroller:focus-visible {
		outline-offset: -4px;
	}

	.spacer {
		position: relative;
		contain: strict;
		width: 100%;
	}

	.floor {
		position: absolute;
		inset: 0 0 auto;
		height: 360px;
		background: var(--wall);
		contain: strict;
		will-change: transform;
	}

	.floor.roof {
		background: linear-gradient(var(--sky), var(--sky) 300px, var(--wall) 300px);
	}

	.floor svg {
		position: absolute;
		left: 50%;
		margin-left: -200px;
		overflow: visible;
	}

	/* Centered on the ladder: the ladder sits at x 304–344 of the 400px-wide floor drawing. */
	.climber {
		position: absolute;
		top: calc(50% - 36px);
		left: calc(50% - 200px + 324px - 32px);
		pointer-events: none;
		filter: drop-shadow(0 6px 10px rgb(0 0 0 / 0.35));
	}

	.jump {
		position: absolute;
		left: 50%;
		bottom: 1rem;
		transform: translateX(-50%);
		font: inherit;
		font-size: var(--step--1);
		font-weight: 600;
		padding: 0.55rem 1rem;
		border: 0;
		border-radius: 999px;
		background: #eef1f6;
		color: #121a2b;
		cursor: pointer;
		white-space: nowrap;
		box-shadow: 0 6px 20px rgb(0 0 0 / 0.3);
	}

	.jump:hover {
		background: #fff;
	}

	.jump:active {
		transform: translateX(-50%) scale(0.97);
	}
</style>
