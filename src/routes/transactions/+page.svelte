<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { getToken, isTokenExpired } from '$lib/storage';
	import { transactions } from '$lib/stores/storage.svelte';
	import type { Transaction } from '$lib/types';

	onMount(() => {
		if (browser) {
			const token = getToken();
			if (!token || isTokenExpired(token)) {
				goto('/');
			}
		}
	});

	let filterChannel: string = 'all';
	let filterStatus: string = 'all';

	$: filteredTransactions = $transactions.filter((tx) => {
		const channelMatch = filterChannel === 'all' || tx.paymentMethod === filterChannel;
		const statusMatch = filterStatus === 'all' || tx.status === filterStatus;
		return channelMatch && statusMatch;
	});

	const channelConfig = {
		cash: { label: 'Cash', emoji: '💵', color: 'text-green-600 dark:text-green-400' },
		promptpay: { label: 'PromptPay', emoji: '💳', color: 'text-blue-600 dark:text-blue-400' },
		lightning: { label: 'Lightning', emoji: '⚡', color: 'text-yellow-600 dark:text-yellow-400' },
		lnurl: { label: 'LNURL', emoji: '⚡', color: 'text-yellow-600 dark:text-yellow-400' },
		cashu: { label: 'Cashu', emoji: '🪙', color: 'text-purple-600 dark:text-purple-400' }
	};

	const statusConfig = {
		paid: { label: 'Success', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
		pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
		failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
	};

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function formatTime(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
	}

	function getItemsSummary(items: Transaction['items']): string {
		return items.map(item => `${item.product.name} x${item.quantity}`).join(', ');
	}
</script>

<main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
	<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">Transaction History</h2>

	<div class="bg-white dark:bg-[#16213e] rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
		<div class="flex flex-col sm:flex-row gap-4">
			<div class="flex-1">
				<label for="filterChannel" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>Payment Method</label
				>
				<select
					id="filterChannel"
					bind:value={filterChannel}
					class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100"
				>
					<option value="all">All</option>
					<option value="cash">Cash</option>
					<option value="promptpay">PromptPay</option>
					<option value="lightning">Lightning</option>
					<option value="lnurl">LNURL</option>
					<option value="cashu">Cashu</option>
				</select>
			</div>
			<div class="flex-1">
				<label for="filterStatus" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>Status</label
				>
				<select
					id="filterStatus"
					bind:value={filterStatus}
					class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100"
				>
					<option value="all">All</option>
					<option value="paid">Success</option>
					<option value="pending">Pending</option>
					<option value="failed">Failed</option>
				</select>
			</div>
		</div>
	</div>

	<div class="bg-white dark:bg-[#16213e] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50 dark:bg-[#1a1a2e]">
					<tr>
						<th class="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
						<th class="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
						<th class="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
						<th class="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
						<th class="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Channel</th>
						<th class="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
					{#each filteredTransactions as tx}
						<tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
							<td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
								{formatDate(tx.createdAt)}
							</td>
							<td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
								{formatTime(tx.createdAt)}
							</td>
							<td class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-500">
								฿{tx.total.toLocaleString()}
							</td>
							<td class="px-4 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={getItemsSummary(tx.items)}>
								{getItemsSummary(tx.items)}
							</td>
							<td class="px-4 sm:px-6 py-4 whitespace-nowrap">
								<span class="inline-flex items-center space-x-1 {channelConfig[tx.paymentMethod]?.color || 'text-gray-600'}">
									<span>{channelConfig[tx.paymentMethod]?.emoji || '💰'}</span>
									<span class="text-sm">{channelConfig[tx.paymentMethod]?.label || tx.paymentMethod}</span>
								</span>
							</td>
							<td class="px-4 sm:px-6 py-4 whitespace-nowrap">
								<span class="px-2 sm:px-3 py-1 inline-flex text-xs sm:text-sm font-medium rounded-full {statusConfig[tx.status].color}">
									{statusConfig[tx.status].label}
								</span>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
								No transactions found
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div class="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
		Showing {filteredTransactions.length} of {$transactions.length} transactions
	</div>
</main>
