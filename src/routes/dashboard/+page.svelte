<script lang="ts">
	import { onMount } from 'svelte';
	import { derived } from 'svelte/store';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { getToken, isTokenExpired } from '$lib/storage';
	import { products, transactions, totalSales, paidTransactions, pendingTransactions, totalTransactions } from '$lib/stores/storage.svelte';

	onMount(() => {
		if (browser) {
			const token = getToken();
			if (!token || isTokenExpired(token)) {
				goto('/');
			}
		}
	});

	const todaysSales = derived(transactions, $transactions => {
		const today = new Date().toDateString();
		return $transactions
			.filter(t => t.status === 'paid' && new Date(t.createdAt).toDateString() === today)
			.reduce((sum, t) => sum + t.total, 0);
	});

	const todaysTransactionCount = derived(transactions, $transactions => {
		const today = new Date().toDateString();
		return $transactions.filter(t => new Date(t.createdAt).toDateString() === today).length;
	});

	const todaysPaidCount = derived(transactions, $transactions => {
		const today = new Date().toDateString();
		return $transactions.filter(t => t.status === 'paid' && new Date(t.createdAt).toDateString() === today).length;
	});

	function formatCurrency(value: number): string {
		return '฿' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
	}

	function formatTime(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
	}

	function getPaymentType(method: string): string {
		return method === 'lnurl' ? 'Lightning' : 'Cashu';
	}
</script>

<main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
		<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">Dashboard</h2>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
			<div class="bg-white dark:bg-[#16213e] p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
				<p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Today's Sales</p>
				<p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{formatCurrency($todaysSales)}</p>
				<p class="text-sm text-green-500">{$paidTransactions} transactions</p>
			</div>
			<div class="bg-white dark:bg-[#16213e] p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
				<p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Today's Transactions</p>
				<p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{$todaysTransactionCount}</p>
				<p class="text-sm text-green-500">{$todaysPaidCount} completed</p>
			</div>
			<div class="bg-white dark:bg-[#16213e] p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
				<p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Products</p>
				<p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{$products.length}</p>
				<p class="text-sm text-gray-500">in stock</p>
			</div>
			<div class="bg-white dark:bg-[#16213e] p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
				<p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sales</p>
				<p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{formatCurrency($totalSales)}</p>
				<p class="text-sm text-gray-500">{$paidTransactions} transactions</p>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
			<div class="bg-white dark:bg-[#16213e] p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Transactions</h3>
				<div class="space-y-3">
					{#each $transactions.slice(0, 5) as tx}
						<div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
							<div>
								<p class="text-sm font-medium text-gray-900 dark:text-gray-100">{formatTime(tx.createdAt)}</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">{getPaymentType(tx.paymentMethod)}</p>
							</div>
							<div class="text-right">
								<p class="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(tx.total)}</p>
								<p class="text-xs {tx.status === 'paid' ? 'text-green-500' : 'text-yellow-500'}">
									{tx.status === 'paid' ? 'Completed' : 'Pending'}
								</p>
							</div>
						</div>
					{:else}
						<p class="text-sm text-gray-500 dark:text-gray-400">No transactions yet</p>
					{/each}
				</div>
			</div>

			<div class="bg-white dark:bg-[#16213e] p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Bitcoin Exchange → THB</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Cashu Bonds pending redemption to THB</p>
				<div class="space-y-3">
					<div class="bg-gray-50 dark:bg-[#1a1a2e] p-4 rounded-lg">
						<div class="flex justify-between items-center mb-2">
							<span class="text-sm text-gray-600 dark:text-gray-400">Bond #001</span>
							<span class="text-sm font-medium text-gray-900 dark:text-gray-100">฿3,500</span>
						</div>
						<p class="text-xs text-gray-500 dark:text-gray-400">Created: 2 hours ago</p>
					</div>
					<div class="bg-gray-50 dark:bg-[#1a1a2e] p-4 rounded-lg">
						<div class="flex justify-between items-center mb-2">
							<span class="text-sm text-gray-600 dark:text-gray-400">Bond #002</span>
							<span class="text-sm font-medium text-gray-900 dark:text-gray-100">฿5,000</span>
						</div>
						<p class="text-xs text-gray-500 dark:text-gray-400">Created: 5 hours ago</p>
					</div>
				</div>
			</div>
		</div>
	</main>
