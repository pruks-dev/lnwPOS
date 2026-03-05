<script lang="ts">
	import { onMount } from 'svelte';
	import { theme, type Theme } from '$lib/theme';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { getToken, isTokenExpired } from '$lib/storage';
	import { auth } from '$lib/stores/auth.svelte';
	import { products } from '$lib/stores/storage.svelte';
	import { transactions } from '$lib/stores/storage.svelte';
	import { clearStorageItem } from '$lib/storage';
	import { initializeMockupData, mockProducts, mockTransactions } from '$lib/mockData';

	onMount(() => {
		if (browser) {
			const token = getToken();
			if (!token || isTokenExpired(token)) {
				goto('/');
			}
		}
		// Load initial theme
		theme.subscribe((t) => (selectedTheme = t));
	});

	let settings = {
		shopName: 'Shop A',
		email: 'shop@example.com',
		phone: '0891234567',
		promptPayId: '0891234567'
	};

	let bitcoinSettings = {
		btcToThbRate: 3450,
		bondExpirationHours: 24,
		platformFeePercentage: 1
	};

	let features = $state({
		enableNotifications: true,
		enableAutoConvert: true,
		autoFetchRates: false
	});

	let hasToggledAutoFetch = false;
	$effect(() => {
		if (features.autoFetchRates && !hasToggledAutoFetch) {
			hasToggledAutoFetch = true;
			fetchBTCRate();
		}
		if (!features.autoFetchRates) {
			hasToggledAutoFetch = false;
		}
	});

	let selectedTheme = $state<Theme>('light');

	let showSaveSuccess = false;
	let isFetchingRates = false;
	let lastFetchedRate = 0;
	let lastFetchedTime = '';
	let isInitializingMockup = false;
	let mockupMessage = '';
	let mockupMessageType = 'success';

	async function fetchBTCRate() {
		isFetchingRates = true;
		try {
			const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=thb');
			const data = await response.json();
			if (data.bitcoin && data.bitcoin.thb) {
				bitcoinSettings.btcToThbRate = Math.floor(data.bitcoin.thb / 100000000);
				lastFetchedRate = data.bitcoin.thb;
				lastFetchedTime = new Date().toLocaleTimeString();
			}
		} catch (error) {
			console.error('Failed to fetch BTC rate:', error);
			alert('Failed to fetch BTC rate from CoinGecko');
		} finally {
			isFetchingRates = false;
		}
	}

	function saveSettings() {
		console.log('Saving settings:', { settings, bitcoinSettings, features });
		showSaveSuccess = true;
		setTimeout(() => (showSaveSuccess = false), 3000);
	}


	onMount(() => {
		// Load initial theme
		theme.subscribe((t) => (selectedTheme = t));
	});

	function updateTheme(newTheme: Theme) {
		selectedTheme = newTheme;
		theme.set(newTheme);
	}

	function handleLogout() {
		if (confirm('Are you sure you want to logout?')) {
			auth.logout();
		}
	}

	function handleClearAllData() {
		if (confirm('Are you sure you want to clear all products and transactions? This cannot be undone.')) {
			clearStorageItem('lnwpos_products');
			clearStorageItem('lnwpos_transactions');
			products.load();
			transactions.load();
			alert('All data has been cleared!');
		}
	}

	function handleLoadMockup() {
		if (!confirm('This will replace all current products and transactions with mockup data. Continue?')) {
			return;
		}

		isInitializingMockup = true;
		mockupMessage = '';

		try {
			const result = initializeMockupData();

			if (result.success) {
				products.load();
				transactions.load();
				mockupMessage = `✅ Mockup data loaded! ${mockProducts.length} products, ${mockTransactions.length} transactions loaded.`;
				mockupMessageType = 'success';
			} else {
				mockupMessage = `❌ Error: ${result.message}`;
				mockupMessageType = 'error';
			}
		} catch (error) {
			console.error('Failed to load mockup data:', error);
			mockupMessage = '❌ Failed to load mockup data. Please try again.';
			mockupMessageType = 'error';
		} finally {
			isInitializingMockup = false;
			setTimeout(() => (mockupMessage = ''), 5000);
		}
	}
</script>

<div class="min-h-screen bg-gray-100 dark:bg-[#1a1a2e]">
	<main class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
		<div class="mb-8">
			<h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Settings</h2>
			<p class="text-sm text-gray-600 dark:text-gray-400">Manage your shop and payment settings</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Shop Information -->
			<div class="bg-white dark:bg-[#16213e] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
				<div class="p-6 border-b border-gray-200 dark:border-gray-700">
					<div class="flex items-center gap-3">
						<span class="text-2xl">🏪</span>
						<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
							Shop Information
						</h3>
					</div>
				</div>
				<div class="p-6 space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
							>Shop Name</label
						>
						<input
							type="text"
							bind:value={settings.shopName}
							class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
							placeholder="Enter shop name"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
							>Email</label
						>
						<input
							type="email"
							bind:value={settings.email}
							class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
							placeholder="shop@example.com"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
							>Phone</label
						>
						<input
							type="tel"
							bind:value={settings.phone}
							class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
							placeholder="0891234567"
						/>
					</div>
				</div>
			</div>

			<!-- Payment Settings -->
			<div class="bg-white dark:bg-[#16213e] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
				<div class="p-6 border-b border-gray-200 dark:border-gray-700">
					<div class="flex items-center gap-3">
						<span class="text-2xl">💳</span>
						<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
							Payment Settings
						</h3>
					</div>
				</div>
				<div class="p-6 space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
							>PromptPay ID</label
						>
						<input
							type="text"
							bind:value={settings.promptPayId}
							class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
							placeholder="0891234567"
						/>
						<p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
							Your PromptPay ID for receiving payments
						</p>
					</div>
				</div>
			</div>

			<!-- Bitcoin Settings -->
			<div class="bg-white dark:bg-[#16213e] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
				<div class="p-6 border-b border-gray-200 dark:border-gray-700">
					<div class="flex items-center gap-3">
						<span class="text-2xl">⚡</span>
						<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
							Bitcoin & Cashu Settings
						</h3>
					</div>
				</div>
				<div class="p-6 space-y-4">
					<!-- BTC Rate with CoinGecko -->
					<div>
						<div class="flex justify-between items-center mb-2">
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>BTC to THB Exchange Rate</label
							>
							<button
								on:click={() => (features.autoFetchRates = !features.autoFetchRates)}
								class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {features.autoFetchRates
									? 'bg-orange-500'
									: 'bg-gray-300 dark:bg-gray-600'}"
							>
								<span
									class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {features.autoFetchRates
										? 'translate-x-6'
										: 'translate-x-1'}"
								></span>
							</button>
						</div>
						<p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
							{#if features.autoFetchRates}
								Auto-fetch enabled - rate will sync from CoinGecko
							{:else}
								Auto-fetch disabled - you can edit the rate manually
							{/if}
						</p>
						<input
							type="number"
							bind:value={bitcoinSettings.btcToThbRate}
							disabled={features.autoFetchRates}
							class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all {features.autoFetchRates
								? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-75'
								: ''}"
						/>
						<p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
							1 BTC ≈ {(bitcoinSettings.btcToThbRate * 100).toLocaleString()} THB
							{#if lastFetchedRate}
								| CoinGecko: {lastFetchedRate.toLocaleString()} THB ({lastFetchedTime})
							{/if}
						</p>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
							>Cashu Bond Expiration</label
						>
						<div class="relative">
							<input
								type="number"
								bind:value={bitcoinSettings.bondExpirationHours}
								class="w-full px-4 py-2.5 pr-16 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
							/>
							<span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400"
								>hours</span
							>
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
							>Platform Fee</label
						>
						<div class="relative">
							<input
								type="number"
								bind:value={bitcoinSettings.platformFeePercentage}
								min="0"
								max="10"
								step="0.1"
								class="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
							/>
							<span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400"
								>%</span
							>
						</div>
					</div>
				</div>
			</div>

			<!-- Features -->
			<div class="bg-white dark:bg-[#16213e] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
				<div class="p-6 border-b border-gray-200 dark:border-gray-700">
					<div class="flex items-center gap-3">
						<span class="text-2xl">⚙️</span>
						<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Features</h3>
					</div>
				</div>
				<div class="p-6 space-y-5">
					<!-- Theme Selector -->
					<div>
						<label class="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
							Theme
						</label>
						<div class="grid grid-cols-2 gap-3">
							<button
								on:click={() => updateTheme('light')}
								class="p-4 rounded-lg border-2 transition-all {selectedTheme === 'light'
									? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
									: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}"
							>
								<div class="text-3xl mb-2">☀️</div>
								<p class="text-sm font-medium text-gray-900 dark:text-gray-100">Light</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">Bright & Clean</p>
							</button>
							<button
								on:click={() => updateTheme('dark')}
								class="p-4 rounded-lg border-2 transition-all {selectedTheme === 'dark'
									? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
									: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}"
							>
								<div class="text-3xl mb-2">🌙</div>
								<p class="text-sm font-medium text-gray-900 dark:text-gray-100">Dark</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes</p>
							</button>
						</div>
					</div>
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900 dark:text-gray-100">
								Enable Notifications
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">Receive alerts for transactions</p>
						</div>
						<button
							on:click={() => (features.enableNotifications = !features.enableNotifications)}
							class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {features.enableNotifications
								? 'bg-orange-500'
								: 'bg-gray-300 dark:bg-gray-600'}"
						>
							<span
								class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {features.enableNotifications
									? 'translate-x-6'
									: 'translate-x-1'}"
							></span>
						</button>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900 dark:text-gray-100">
								Enable Auto-Convert
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								Automatically convert Lightning to Cashu Bonds
							</p>
						</div>
						<button
							on:click={() => (features.enableAutoConvert = !features.enableAutoConvert)}
							class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {features.enableAutoConvert
								? 'bg-orange-500'
								: 'bg-gray-300 dark:bg-gray-600'}"
						>
							<span
								class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {features.enableAutoConvert
									? 'translate-x-6'
									: 'translate-x-1'}"
							></span>
						</button>
					</div>

				</div>
			</div>
		</div>

		<!-- Save Button -->
		<!-- <div class="mt-8 flex justify-end">
			<button
				on:click={saveSettings}
				class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-all hover:shadow-lg flex items-center gap-2"
			>
				<span>💾</span>
				<span>Save Settings</span>
			</button>
		</div> -->

		<!-- Success Message -->
		{#if showSaveSuccess}
			<div class="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg animate-fade-in">
				<p class="text-sm text-green-700 dark:text-green-300 text-center font-medium">
					✅ Settings saved successfully!
				</p>
			</div>
		{/if}

		<!-- Logout & Data Management -->
		<div class="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Account & Data</h3>
			<div class="bg-white dark:bg-[#16213e] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
				<div class="p-6 space-y-4">
					<!-- Load Mockup Data -->
					<!-- <div class="flex items-center justify-between py-3">
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900 dark:text-gray-100">Load Mockup Data</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">Load sample products and transactions (for demo)</p>
						</div>
						<div class="flex-shrink-0">
							<button
								on:click={handleLoadMockup}
								disabled={isInitializingMockup}
								class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all text-base min-w-[100px] text-center disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isInitializingMockup ? 'Loading...' : 'Load'}
							</button>
						</div>
					</div> -->
					<!-- Clear All Data -->
					<div class="flex items-center justify-between py-3">
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900 dark:text-gray-100">Clear All Data</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">Remove all products and transactions (for demo)</p>
						</div>
						<div class="flex-shrink-0">
							<button
								on:click={handleClearAllData}
								class="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-all text-base min-w-[100px] text-center"
							>
								Clear
							</button>
						</div>
					</div>
					<!-- Logout -->
					<div class="flex items-center justify-between py-3">
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900 dark:text-gray-100">Logout</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">Sign out of your account</p>
						</div>
						<div class="flex-shrink-0">
							<button
								on:click={handleLogout}
								class="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-all text-base min-w-[100px] text-center"
							>
								Logout
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Mockup Message -->
		{#if mockupMessage}
			<div class="mt-4 {mockupMessageType === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border p-4 rounded-lg animate-fade-in">
				<p class="text-sm {mockupMessageType === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'} text-center font-medium">
					{mockupMessage}
				</p>
			</div>
		{/if}
	</main>
</div>