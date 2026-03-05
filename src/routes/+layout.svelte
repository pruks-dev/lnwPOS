<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { theme } from '$lib/theme';
	import { page } from '$app/stores';

	let showNavbar = false;

	$: showNavbar = $page.url.pathname !== '/';

	onMount(() => {
		if ($theme === 'dark') {
			document.documentElement.classList.add('dark');
		}
	});
</script>

<svelte:head>
	<title>LnwPoS - Bitcoin Lightning POS</title>
	<style>
		/* เพิ่ม safe area สำหรับ mobile */
		:global(html, body) {
			background-color: #f3f4f6;
		}
		:global(.dark) html,
		:global(.dark) body {
			background-color: #1a1a2e;
		}
		:global(body) {
			padding-top: 0;
			padding-bottom: 0;
		}
	</style>
</svelte:head>

{#if showNavbar}
	<Navbar />
{/if}

<div class="min-h-screen bg-gray-100 dark:bg-[#1a1a2e] pb-20 md:pb-16 pt-16">
	<slot />
</div>
