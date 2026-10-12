<script lang="ts">
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="progress" aria-hidden="true"></div>
{@render children()}

<style>
	/* Scroll progress driven entirely by the compositor: no JS, no scroll listeners. */
	.progress {
		position: fixed;
		inset: 0 0 auto;
		height: 3px;
		background: var(--signal);
		transform-origin: 0 50%;
		transform: scaleX(0);
		z-index: 10;
	}

	@supports (animation-timeline: scroll()) {
		.progress {
			animation: grow linear both;
			animation-timeline: scroll(root);
		}
	}

	@keyframes grow {
		to {
			transform: scaleX(1);
		}
	}
</style>
