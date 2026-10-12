<script lang="ts">
	import { onMount } from 'svelte';

	let deferred = $state<BeforeInstallPromptEvent | null>(null);
	let installed = $state(false);

	onMount(() => {
		installed = matchMedia('(display-mode: standalone)').matches;
		const onPrompt = (e: BeforeInstallPromptEvent) => {
			e.preventDefault();
			deferred = e;
		};
		const onInstalled = () => ((installed = true), (deferred = null));
		addEventListener('beforeinstallprompt', onPrompt);
		addEventListener('appinstalled', onInstalled);
		return () => {
			removeEventListener('beforeinstallprompt', onPrompt);
			removeEventListener('appinstalled', onInstalled);
		};
	});

	async function install() {
		if (!deferred) return;
		await deferred.prompt();
		const { outcome } = await deferred.userChoice;
		if (outcome === 'accepted') installed = true;
		deferred = null;
	}
</script>

{#if installed}
	<span class="installed">Installed as an app</span>
{:else if deferred}
	<button type="button" onclick={install}>Install as app</button>
{/if}

<style>
	button {
		font: inherit;
		font-weight: 600;
		padding: 0.7rem 1.15rem;
		border: 1px solid var(--ink);
		border-radius: 999px;
		background: transparent;
		color: var(--ink);
		cursor: pointer;
		transition:
			background-color 0.2s var(--ease-out),
			color 0.2s var(--ease-out);
	}

	button:hover {
		background: var(--ink);
		color: var(--paper);
	}

	button:active {
		transform: scale(0.98);
	}

	.installed {
		color: var(--muted);
	}
</style>
