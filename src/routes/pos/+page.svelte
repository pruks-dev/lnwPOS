<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { getToken, isTokenExpired } from '$lib/storage';
	import { products, transactions } from '$lib/stores/storage.svelte';
	import type { Product, Transaction, TransactionItem } from '$lib/types';
	import { createOpenPlebService, calculateSatsFromTHB } from '$lib/openpleb';
	import type { OpenPlebService } from '$lib/openpleb';
	import QRCode from 'qrcode';
	import type { OpenPlebOffer } from '$lib/types';

	const categoryEmojis: Record<string, string> = {
		'Drinks': '☕',
		'Food': '🥪',
		'Snacks': '🍰'
	};

	function getEmoji(category: string): string {
		return categoryEmojis[category] || '📦';
	}

	onMount(() => {
		if (browser) {
			const token = getToken();
			if (!token || isTokenExpired(token)) {
				goto('/');
			}
			loadOpenPlebConfig();
		}
	});

	async function loadOpenPlebConfig() {
		try {
			const settings = JSON.parse(localStorage.getItem('lnwpos_settings') || '{}');
			const openPlebConfig = settings.openPleb || {};

			if (settings.promptPayId) {
				promptPayId = settings.promptPayId;
			}

			if (settings.conversionRate) {
				conversionRate = settings.conversionRate;
			}

			if (openPlebConfig.enabled && openPlebConfig.apiUrl) {
				openPlebService = createOpenPlebService(openPlebConfig.apiUrl);
				selectedFiatProviderId = 1;
			}
		} catch (error) {
			console.error('Failed to load OpenPleb config:', error);
		}
	}

	type PaymentChannel = 'cash' | 'promptpay' | 'lightning' | 'openpleb';

	let cart = $state<{ id: string; name: string; price: number; quantity: number; emoji: string }[]>([]);
	let invoiceAmount = $state(0);
	let qrCode = $state('');
	let qrCodeImage = $state('');
	let showPayment = $state(false);
	let selectedChannel = $state<PaymentChannel>('cash');
	let promptPayId = $state('0891234567');

	let openPlebOffer = $state<OpenPlebOffer | null>(null);
	let isCreatingOffer = $state(false);
	let isPaid = $state(false);
	let invoiceState = $state<string | null>(null);
	let openPlebError = $state('');
	let copySuccess = $state(false);
	let openPlebService: OpenPlebService | null = null;
	let selectedFiatProviderId: number | null = null;

	let conversionRate = $state(2324117);

	async function copyToClipboard(text: string) {
		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(text);
			} else {
				const textarea = document.createElement('textarea');
				textarea.value = text;
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand('copy');
				document.body.removeChild(textarea);
			}
			copySuccess = true;
			setTimeout(() => copySuccess = false, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	const channelConfig = {
		cash: { label: 'Cash', emoji: '💵', color: 'bg-green-500' },
		promptpay: { label: 'PromptPay', emoji: '💳', color: 'bg-blue-500' },
		lightning: { label: 'Lightning', emoji: '⚡', color: 'bg-yellow-500' },
		openpleb: { label: 'OpenPleb', emoji: '🔶', color: 'bg-purple-500' }
	};

	function addToCart(product: Product) {
		console.log('addToCart called:', product);
		const existingIndex = cart.findIndex((item) => item.id === product.id);
		if (existingIndex !== -1) {
			cart[existingIndex].quantity++;
			cart = [...cart]; // Force reactivity
		} else {
			cart = [...cart, { ...product, quantity: 1, emoji: getEmoji(product.category) }];
		}
		updateTotal();
		console.log('Cart after add:', cart);
	}

	function removeFromCart(productId: string) {
		const index = cart.findIndex((item) => item.id === productId);
		if (index > -1) {
			if (cart[index].quantity > 1) {
				cart[index].quantity--;
			} else {
				cart = cart.filter((item) => item.id !== productId);
			}
		}
		updateTotal();
	}

	function updateTotal() {
		invoiceAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
	}

	function generateLightningInvoice() {
		const satoshis = calculateSatsFromTHB(invoiceAmount, conversionRate);
		qrCode = `lnbc${satoshis}n1p3xnhl2pp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqszjq5rz5q6sve344q3s2a8lgvxh0y0vzv9xh6tgpmp2q6sve344q3s2a8lgvxh0y0vzv9xh6tgpmp2q6sve344q3s2a8lgvxh0y0vzv9xh6tgpmp2p3xnhl2p3xnhl2p3xnhl2p3xnhl2p3xnhl2`;
		showPayment = true;
	}

	async function createOpenPlebOffer() {
		isCreatingOffer = true;
		openPlebError = '';
		openPlebOffer = null;

		try {
			const settings = JSON.parse(localStorage.getItem('lnwpos_settings') || '{}');
			const openPlebConfig = settings.openPleb || {};

			if (!openPlebConfig.enabled || !openPlebConfig.pubkey) {
				openPlebError = 'OpenPleb is not configured. Please add your pubkey in Settings.';
				return;
			}

			if (!selectedFiatProviderId) {
				openPlebError = 'No fiat provider available. Please try again.';
				return;
			}

			const openPleb = createOpenPlebService(openPlebConfig.apiUrl);
			const qrCodeValue = settings.promptPayId || promptPayId;

			const result = await openPleb.createOffer({
				amount: invoiceAmount,
				pubkey: openPlebConfig.pubkey,
				fiatProviderId: selectedFiatProviderId,
				qrCode: qrCodeValue
			});

			openPlebOffer = result.offer;
			const offerId = openPlebOffer.id;

			await openPleb.createInvoice(offerId);

			let isCreated = false;
			let pollAttempts = 0;
			const maxPollAttempts = 30;

			while (!isCreated && pollAttempts < maxPollAttempts) {
				await new Promise(resolve => setTimeout(resolve, 2000));
				const dataResult = await openPleb.getOfferData(offerId);
				console.log('Offer data:', JSON.stringify(dataResult, null, 2));
				openPlebOffer = dataResult.offer;
				if (openPlebOffer) {
					const invoice = (openPlebOffer as any).lnInvoice || openPlebOffer.invoice;
					if (invoice) {
						qrCode = invoice;
						qrCodeImage = await QRCode.toDataURL(qrCode, { width: 256, margin: 2 });
						isCreated = true;
					}
				}
				pollAttempts++;
			}

			console.log('Final qrCode:', qrCode);
			showPayment = true;
			isCreatingOffer = false;

			isPaid = false;
			invoiceState = null;
			async function checkPayment() {
				let checkPaidAttempts = 0;
				const maxCheckPaidAttempts = 60;

				while (!isPaid && checkPaidAttempts < maxCheckPaidAttempts) {
					await new Promise(resolve => setTimeout(resolve, 3000));
					const paidResult = await openPleb.checkPaidInvoice(offerId);
					console.log('Paid check result:', paidResult);
					if (paidResult.state == 'PAID' || paidResult == 'ISSUED') {
						isPaid = true;
						invoiceState = paidResult.state || 'PAID';
					}
					checkPaidAttempts++;
				}
			}
			checkPayment();
		} catch (error) {
			console.error('Failed to create OpenPleb offer:', error);
			const message = error instanceof Error ? error.message : 'Failed to create offer';
			openPlebError = message.length > 100 ? message.substring(0, 100) + '...' : message;
			isCreatingOffer = false;
		}
	}

	function generateTransactionId(): string {
		return `TX${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
	}

	function checkout(): { success: boolean; message: string } {
		if (cart.length === 0) {
			return { success: false, message: 'Cart is empty. Please add items first.' };
		}

		const now = new Date();
		const createdAt = now.toISOString();

		const transactionItems: TransactionItem[] = cart.map(item => ({
			product: {
				id: item.id,
				name: item.name,
				price: item.price,
				category: '',
				stock: 0,
				createdAt: createdAt
			},
			quantity: item.quantity,
			subtotal: item.price * item.quantity
		}));

		const paymentMethodMap: Record<PaymentChannel, 'cash' | 'promptpay' | 'lightning' | 'lnurl'> = {
			cash: 'cash',
			promptpay: 'promptpay',
			lightning: 'lightning',
			openpleb: 'lnurl'
		};

		const transaction: Transaction = {
			id: generateTransactionId(),
			items: transactionItems,
			total: invoiceAmount,
			paymentMethod: paymentMethodMap[selectedChannel],
			status: 'paid',
			invoice: qrCode || undefined,
			memo: '',
			paidAt: createdAt,
			createdAt: createdAt
		};

		transactions.add(transaction);

		return { success: true, message: 'Payment successful!' };
	}

	function resetPaymentState() {
		cart = [];
		invoiceAmount = 0;
		showPayment = false;
		selectedChannel = 'cash';
		qrCode = '';
		qrCodeImage = '';
		openPlebOffer = null;
		openPlebError = '';
		isPaid = false;
		invoiceState = null;
	}

	function completePayment() {
		const result = checkout();
		if (result.success) {
			alert('✅ ' + result.message);
			resetPaymentState();
		} else {
			alert('❌ ' + result.message);
		}
	}
</script>

<main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
		<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">Point of Sale</h2>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
			<div class="lg:col-span-2">
				<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
					{#each $products as product}
						<button
							on:click={() => addToCart(product)}
							disabled={showPayment}
							class="bg-white dark:bg-[#16213e] p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:ring-2 hover:ring-orange-500 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<div class="text-3xl sm:text-4xl mb-2">{getEmoji(product.category)}</div>
							<h3 class="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base mb-1">{product.name}</h3>
							<p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">{product.category}</p>
							<p class="text-lg font-bold text-orange-500">฿{product.price}</p>
						</button>
					{/each}
				</div>
			</div>

			<div class="bg-white dark:bg-[#16213e] p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700 h-fit">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Cart</h3>

				{#if cart.length === 0}
					<p class="text-gray-500 dark:text-gray-400 text-center py-8">Your cart is empty</p>
				{:else}
					<div class="space-y-3 mb-4 max-h-48 sm:max-h-64 overflow-y-auto">
						{#each cart as item}
							<div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900 dark:text-gray-100">{item.emoji} {item.name}</p>
									<p class="text-xs text-gray-500 dark:text-gray-400">฿{item.price} x {item.quantity}</p>
								</div>
								<div class="flex items-center space-x-2">
									<span class="text-sm font-medium text-gray-900 dark:text-gray-100">฿{item.price * item.quantity}</span>
									<button
										on:click={() => removeFromCart(item.id)}
										disabled={showPayment}
										class="text-red-500 hover:text-red-700 text-sm w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
										>−</button
									>
								</div>
							</div>
						{/each}
					</div>

					<div class="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
						<div class="flex justify-between items-center">
							<span class="text-lg font-semibold text-gray-900 dark:text-gray-100">Total</span>
							<span class="text-2xl sm:text-3xl font-bold text-orange-500">฿{invoiceAmount}</span>
						</div>
					</div>

					{#if !showPayment}
						<button
							on:click={generateLightningInvoice}
							class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
							disabled={invoiceAmount === 0}
						>
							Checkout
						</button>
					{:else}
						<div class="space-y-4">
							<div class="grid grid-cols-4 gap-2">
								{#each Object.entries(channelConfig) as [key, config]}
									<button
										on:click={() => selectedChannel = key as PaymentChannel}
										class="py-2 sm:py-3 px-1 sm:px-2 rounded-lg text-xs sm:text-sm font-medium transition-all {selectedChannel === key ? `${config.color} text-white` : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}"
									>
										<span class="block text-lg mb-1">{config.emoji}</span>
										<span class="hidden sm:inline">{config.label}</span>
									</button>
								{/each}
							</div>

							{#if selectedChannel === 'cash'}
								<div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
									<div class="text-4xl mb-2">💵</div>
									<p class="text-lg font-semibold text-gray-900 dark:text-gray-100">Cash Amount</p>
									<p class="text-3xl font-bold text-green-600 dark:text-green-400">฿{invoiceAmount}</p>
									<p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">Accept cash from customer</p>
								</div>
							{:else if selectedChannel === 'promptpay'}
								<div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
									<div class="text-4xl mb-2">💳</div>
									<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">PromptPay ID</p>
									<p class="text-lg font-mono font-bold text-gray-900 dark:text-gray-100 mb-2">{promptPayId}</p>
									<div class="bg-white dark:bg-gray-800 p-2 rounded-lg inline-block">
										<div class="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
											<span class="text-xs text-gray-500">QR Code</span>
										</div>
									</div>
									<p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">Scan QR to pay</p>
								</div>
							{:else if selectedChannel === 'lightning'}
								<div class="text-center">
									<div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
										<div class="text-4xl mb-2">⚡</div>
										<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Lightning Invoice</p>
										<div class="bg-white dark:bg-gray-800 p-3 rounded-lg">
											<div class="w-32 h-32 mx-auto bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2">
												<span class="text-xs text-gray-500">QR</span>
											</div>
											<p class="text-xs font-mono text-gray-500 dark:text-gray-400 break-all flex items-center gap-2">
												<span class="flex-1">{qrCode.slice(0, 40)}...</span>
												<button
													on:click={() => copyToClipboard(qrCode)}
													class="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded"
												>
													{copySuccess ? 'Copied!' : 'Copy'}
												</button>
											</p>
										</div>
									</div>
								</div>
							{:else if selectedChannel === 'openpleb'}
								<div class="text-center">
									{#if isCreatingOffer}
										<div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
											<div class="text-4xl mb-2">🔄</div>
											<p class="text-sm text-gray-600 dark:text-gray-400">Creating OpenPleb offer...</p>
										</div>
									{:else if openPlebError}
										<div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
											<div class="text-4xl mb-2">❌</div>
											<p class="text-sm text-red-600 dark:text-red-400">{openPlebError}</p>
										</div>
									{:else if openPlebOffer}
										<div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mb-4">
											<div class="text-4xl mb-2">🔶</div>
											<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">OpenPleb Invoice</p>
											{#if isPaid}
												{#if invoiceState === 'ISSUED'}
													<p class="text-lg font-bold text-red-600 mb-2">⚠️ Invoice has ISSUE</p>
												{:else}
													<p class="text-lg font-bold text-green-600 mb-2">✓ Invoice Paid!</p>
												{/if}
											{:else}
												<p class="text-sm text-yellow-600 dark:text-yellow-400 mb-2 animate-pulse">Waiting for taker to pay...</p>
											{/if}
											<p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
												Offer ID: {openPlebOffer.id} | Status: {openPlebOffer.status}
											</p>
											<p class="text-lg font-bold text-purple-600 dark:text-purple-400 mb-2">
												{openPlebOffer.satsAmount} sats
											</p>
											{#if !isPaid}
												<div class="bg-white dark:bg-gray-800 p-3 rounded-lg">
													{#if qrCodeImage}
														<img src={qrCodeImage} alt="QR Code" class="w-48 h-48 mx-auto mb-2" />
													{:else}
														<div class="w-32 h-32 mx-auto bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2">
															<span class="text-xs text-gray-500">Generating...</span>
														</div>
													{/if}
													<p class="text-xs font-mono text-gray-500 dark:text-gray-400 break-all flex items-center gap-2">
														<span class="flex-1">{qrCode ? qrCode.slice(0, 40) + '...' : 'No invoice yet'}</span>
														{#if qrCode}
															<button
																on:click={() => copyToClipboard(qrCode)}
																class="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded"
															>
																{copySuccess ? 'Copied!' : 'Copy'}
															</button>
														{/if}
													</p>
												</div>
												<p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
													1. Show invoice to customer | 2. Customer pays you cash/PromptPay | 3. Wait for taker to complete trade
												</p>
											{/if}
										</div>
									{:else}
										<div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
											<div class="text-4xl mb-2">🔶</div>
											<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Sell Bitcoin via OpenPleb</p>
											<p class="text-lg font-bold text-purple-600 dark:text-purple-400">
												~{calculateSatsFromTHB(invoiceAmount, conversionRate)} sats
											</p>
											<p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
												1. Customer pays you cash/PromptPay | 2. Taker online buys Bitcoin | 3. You get Bitcoin back as Cashu
											</p>
											<button
												on:click={createOpenPlebOffer}
												disabled={invoiceAmount === 0}
												class="mt-4 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											>
												Create Offer
											</button>
										</div>
									{/if}
								</div>
							{/if}

							<div class="flex space-x-2">
								<button
									on:click={completePayment}
									disabled={selectedChannel === 'openpleb' && !qrCode}
									class="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
								>
									✅ Confirm
								</button>
								<button
									on:click={resetPaymentState}
									class="px-4 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-lg transition-colors"
								>
									Cancel
								</button>
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</main>
