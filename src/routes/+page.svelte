<script lang="ts">
	import { toggleTheme, theme } from '$lib/theme';
	import { auth } from '$lib/stores/auth.svelte';
	import { getUser, getToken } from '$lib/storage';
	import { initializeMockupData } from '$lib/mockData';

	let userId = '';
	let password = '';
	let errorMessage = '';
	let initializing = false;
	let initMessage = '';

	async function handleLogin() {
		errorMessage = '';
		const result = auth.login(userId, password);

		if (result.success) {
			const user = getUser();
			const token = getToken();
			if (user && token) {
				await fetch('/api/auth', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ user, token })
				});
			}
			window.location.href = '/dashboard';
		} else {
			errorMessage = result.error || 'Invalid credentials';
		}
	}

	function loadMockupData() {
		initializing = true;
		initMessage = '';
		try {
			const result = initializeMockupData();
			if (result.success && result.data) {
				initMessage = `Loaded: ${result.data.productsCount} products, ${result.data.transactionsCount} transactions`;
			} else {
				initMessage = 'Failed to load mock data';
			}
		} catch (error) {
			initMessage = 'Error loading mock data';
		}
		initializing = false;
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#1a1a2e] px-4">
	<div class="bg-white dark:bg-[#16213e] p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
		<div class="text-center mb-6 sm:mb-8">
			<h1 class="text-3xl sm:text-4xl font-bold text-orange-500 mb-2">LnwPoS</h1>
			<p class="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Bitcoin Lightning Point of Sale</p>
		</div>

		<form on:submit|preventDefault={handleLogin} class="space-y-4">
			<div>
				<label for="userId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>User ID</label
				>
				<input
					id="userId"
					type="text"
					bind:value={userId}
					placeholder="user001"
					class="w-full px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100 text-base sm:text-lg"
					required
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>Password</label
				>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="••••••••"
					class="w-full px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100 text-base sm:text-lg"
					required
				/>
			</div>

			{#if errorMessage}
				<p class="text-red-500 text-sm text-center">{errorMessage}</p>
			{/if}

			<button
				type="submit"
				class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 sm:py-4 px-4 rounded-lg transition-colors text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={!userId || !password}
			>
				Login
			</button>
		</form>

		<!-- <div class="mt-4">
			<button
				on:click={loadMockupData}
				disabled={initializing}
				class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
			>
				{initializing ? 'Loading...' : 'Load Mockup Data'}
			</button>
			{#if initMessage}
				<p class="text-green-500 text-xs text-center mt-2">{initMessage}</p>
			{/if}
		</div> -->

		<div class="mt-6 sm:mt-8 text-center">
			<button
				on:click={toggleTheme}
				class="inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors"
			>
				{#if $theme === 'dark'}
					<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
					</svg>
					<span>Light Mode</span>
				{:else}
					<svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
						<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
					</svg>
					<span>Dark Mode</span>
				{/if}
			</button>
		</div>

		<div class="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
			<p>Powered by Openpleb</p>
		</div>
	</div>
</div>
