<script lang="ts">
	import { onMount } from 'svelte';
	import Climber from './Climber.svelte';
	import {
		FLOOR_HEIGHT as H,
		FLOORS,
		TILES,
		WINDOW_X,
		climbPhase,
		floor,
		floorNumber,
		visibleRange,
		type Floor
	} from './tower';

	const SIGNS = ['MEOW', 'OPEN', 'BUN', 'NOMS'];
	const GROUND = TILES - 1;

	let scroller: HTMLDivElement;
	let top = $state(0);
	let viewport = $state(480);
	let fps = $state<number | null>(null);
	let reduceMotion = $state(false);
	let lean = $state(0);
	let look = $state(0);

	const range = $derived(visibleRange(top, viewport));
	const floors = $derived.by(() => {
		const out: Floor[] = [];
		for (let i = range.first; i <= range.last; i++) out.push(floor(i));
		return out;
	});
	const current = $derived(Math.min(GROUND, Math.floor((top + viewport / 2) / H)));
	const currentNumber = $derived(floorNumber(current));
	const atBottom = $derived(top + viewport >= TILES * H - 2);
	const phase = $derived(reduceMotion ? 0 : climbPhase(top));

	// While the tower moves, read the position once per frame (never per scroll event),
	// derive speed for the lean and the eyes, and count frames for the fps readout.
	let running = false;
	let idleAt = 0;
	let frames = 0;
	let windowStart = 0;
	let last = 0;
	let lastTop = 0;
	let speed = 0; // px per ms, smoothed

	function frame(now: number) {
		top = scroller.scrollTop;
		const dt = Math.max(1, now - last);
		speed = speed * 0.85 + ((top - lastTop) / dt) * 0.15;
		last = now;
		lastTop = top;

		if (!reduceMotion) {
			lean = Math.max(-9, Math.min(9, -speed * 5));
			look = Math.abs(speed) > 0.05 ? Math.sign(speed) : look * 0.9;
		}

		frames++;
		if (now - windowStart >= 500) {
			fps = Math.round((frames * 1000) / (now - windowStart));
			frames = 0;
			windowStart = now;
		}

		// Keep going until the scroll has stopped and the cat has settled back upright.
		if (now < idleAt || Math.abs(speed) > 0.005 || Math.abs(lean) > 0.05) {
			requestAnimationFrame(frame);
		} else {
			running = false;
			lean = 0;
			look = 0;
		}
	}

	function onScroll() {
		idleAt = performance.now() + 250;
		if (running) return;
		running = true;
		frames = 0;
		last = windowStart = performance.now();
		lastTop = scroller.scrollTop;
		requestAnimationFrame(frame);
	}

	function travel() {
		scroller.scrollTo({
			top: atBottom ? 0 : TILES * H,
			behavior: reduceMotion ? 'auto' : 'smooth'
		});
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
			<dd>
				{currentNumber === null
					? 'the roof'
					: currentNumber === 1
						? 'the ground floor'
						: `floor ${currentNumber}`}
			</dd>
		</div>
		<div>
			<dt>Floors in the page</dt>
			<dd>{floors.length} <span>of {FLOORS}</span></dd>
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
			<div class="spacer" style:height="{TILES * H}px">
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
									{#if !(f.index === GROUND && x === 44)}
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
									{/if}
								{/each}
								<rect x="-2000" y="342" width="4400" height="18" fill="var(--ledge)" />
							{/if}
							{#if f.index === GROUND}
								<g transform="translate(44 150)">
									<rect x="-6" y="-6" width="116" height="192" rx="4" fill="var(--ledge)" />
									<rect width="104" height="186" fill="#2b2140" />
									<rect x="10" y="12" width="84" height="56" rx="3" fill="hsl(42 96% 68%)" />
									<circle cx="86" cy="112" r="5" fill="#f5edd0" />
								</g>
								<g stroke="var(--rail)" stroke-width="4" fill="none" stroke-linecap="round">
									<path d="M-40 336V180m0 0h22" />
								</g>
								<circle cx="-16" cy="186" r="16" fill="hsl(44 96% 70%)" opacity=".35" />
								<circle cx="-16" cy="186" r="7" fill="hsl(44 96% 75%)" />
								<rect x="-2000" y="336" width="4400" height="24" fill="#2a3352" />
								<rect x="-2000" y="336" width="4400" height="4" fill="#3a4670" />
							{/if}
							<!-- Fire escape: rails run through every floor so the ladder never breaks. -->
							{#if f.index === GROUND}
								<path d="M304 0v286M344 0v286" stroke="var(--rail)" stroke-width="5" />
								<path
									d="M304 15h40M304 45h40M304 75h40M304 105h40M304 135h40M304 165h40M304 195h40M304 225h40M304 255h40M304 284h40"
									stroke="var(--rail)"
									stroke-width="3"
								/>
							{:else if f.index > 0}
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
		<div class="climber">
			<Climber {phase} {lean} {look} />
		</div>

		<button type="button" class="jump" onclick={travel}>
			{atBottom ? 'Back to the roof' : 'Skip to the ground floor'}
		</button>
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
		top: calc(50% - 50px);
		left: calc(50% - 200px + 324px - 40px);
		width: 80px;
		height: 100px;
		pointer-events: none;
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
