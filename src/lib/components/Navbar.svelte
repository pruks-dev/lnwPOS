<script lang="ts">
	import { page } from '$app/stores';

	const navItems = [
		{ label: 'Dashboard', href: '/dashboard', icon: '📊' },
		{ label: 'POS', href: '/pos', icon: '🛒' },
		{ label: 'Products', href: '/products', icon: '📦' },
		{ label: 'Transactions', href: '/transactions', icon: '📋' },
		{ label: 'Settings', href: '/settings', icon: '⚙️' }
	];
</script>

<nav
	class="fixed top-0 left-0 right-0 bg-white dark:bg-[#16213e] border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 z-50"
>
	<div class="max-w-7xl mx-auto flex justify-between items-center">
		<a href="/" class="text-2xl font-bold text-orange-500 flex items-center gap-2">
			<span>⚡</span>
			<span>LnwPoS</span>
		</a>

		<!-- Desktop Navigation -->
		<div class="hidden md:flex items-center space-x-6">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-2 text-sm font-medium transition-colors {$page.url.pathname === item.href
						? 'text-orange-500'
						: 'text-gray-600 dark:text-gray-400 hover:text-orange-500'}"
				>
					<span>{item.icon}</span>
					<span>{item.label}</span>
				</a>
			{/each}
			<span class="text-sm text-gray-500 dark:text-gray-400">|</span>
			<span class="text-sm text-gray-500 dark:text-gray-400">Shop A</span>
		</div>
	</div>
</nav>

<!-- Mobile Bottom Navigation -->
<nav
	class="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#16213e] border-t border-gray-200 dark:border-gray-700 z-50"
>
	<div class="flex justify-around items-center py-2">
		{#each navItems.slice(0, 5) as item}
			<a
				href={item.href}
				class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors {$page.url.pathname === item.href
					? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20'
					: 'text-gray-600 dark:text-gray-400 hover:text-orange-500'}"
			>
				<span class="text-xl">{item.icon}</span>
				<span class="text-xs font-medium">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>

