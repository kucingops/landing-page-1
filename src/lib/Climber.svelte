<script lang="ts">
	// The tower's mascot, drawn facing you while it climbs. Every limb is computed from the
	// climbing phase, so the pose follows the scroll position continuously (and runs in
	// reverse when you scroll up). Idle motion (tail, blinking) is pure CSS.
	let {
		phase = 0,
		lean = 0,
		look = 0
	}: { phase?: number; lean?: number; look?: number } = $props();

	const s = $derived(Math.sin(phase));
	const bob = $derived(Math.sin(phase * 2) * 1.6);

	// Opposite arm and leg move together, like a real climber.
	const handL = $derived({ x: 17, y: 28 - 9 * s });
	const handR = $derived({ x: 63, y: 28 + 9 * s });
	const footL = $derived({ x: 24, y: 88 + 7 * s });
	const footR = $derived({ x: 56, y: 88 - 7 * s });

	const limb = (from: [number, number], bend: [number, number], to: { x: number; y: number }) =>
		`M${from[0]} ${from[1]}Q${bend[0]} ${bend[1]} ${to.x} ${to.y.toFixed(2)}`;
</script>

<svg class="climber" viewBox="0 0 80 100" width="80" height="100" aria-hidden="true">
	<g style:transform="translateY({bob.toFixed(2)}px) rotate({lean.toFixed(2)}deg)" class="body">
		<!-- Tail sits behind everything. -->
		<path class="tail" d="M46 74q22 4 20 22" />

		<!-- Limbs behind the body, a shade darker for depth. -->
		<g class="limbs">
			<path d={limb([30, 48], [16, 48 - 4 * s], handL)} />
			<path d={limb([50, 48], [64, 48 + 4 * s], handR)} />
			<path d={limb([33, 72], [18, 76], footL)} />
			<path d={limb([47, 72], [62, 76], footR)} />
		</g>
		<g class="paws">
			<circle cx={handL.x} cy={handL.y.toFixed(2)} r="5" />
			<circle cx={handR.x} cy={handR.y.toFixed(2)} r="5" />
			<circle cx={footL.x} cy={footL.y.toFixed(2)} r="5" />
			<circle cx={footR.x} cy={footR.y.toFixed(2)} r="5" />
		</g>

		<ellipse class="fur" cx="40" cy="62" rx="15" ry="17" />
		<ellipse class="belly" cx="40" cy="66" rx="8" ry="10" />

		<g class="head">
			<path class="fur" d="M25 30 22 10l15 11h6l15-11-3 20Z" />
			<path class="ear" d="m26 25-2-10 8 7Zm28 0 2-10-8 7Z" />
			<circle class="fur" cx="40" cy="36" r="16" />
			<g class="eyes" style:transform="translateY({(look * 1.6).toFixed(2)}px)">
				<ellipse cx="34" cy="35" rx="2.6" ry="3.4" />
				<ellipse cx="46" cy="35" rx="2.6" ry="3.4" />
			</g>
			<path class="nose" d="M38.4 41h3.2L40 43Z" />
		</g>
	</g>
</svg>

<style>
	.climber {
		overflow: visible;
		filter: drop-shadow(0 6px 10px rgb(0 0 0 / 0.35));
	}

	.body {
		transform-box: view-box;
		transform-origin: 40px 60px;
	}

	.fur,
	.paws {
		fill: #eef1f6;
	}

	.belly {
		fill: #ffffff;
	}

	.limbs path {
		fill: none;
		stroke: #d5ddea;
		stroke-width: 8;
		stroke-linecap: round;
	}

	.paws circle {
		fill: #e4e9f2;
	}

	.ear,
	.nose {
		fill: #ff9db3;
	}

	.eyes {
		fill: #1f4fff;
	}

	.eyes ellipse {
		transform-box: fill-box;
		transform-origin: center;
		animation: blink 5.2s infinite;
	}

	.tail {
		fill: none;
		stroke: #eef1f6;
		stroke-width: 6;
		stroke-linecap: round;
		transform-box: view-box;
		transform-origin: 46px 74px;
		animation: swish 1.9s ease-in-out infinite alternate;
	}

	@keyframes blink {
		0%,
		92%,
		100% {
			transform: scaleY(1);
		}
		95% {
			transform: scaleY(0.1);
		}
	}

	@keyframes swish {
		from {
			transform: rotate(-14deg);
		}
		to {
			transform: rotate(16deg);
		}
	}
</style>
