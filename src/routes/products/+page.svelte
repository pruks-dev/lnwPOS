<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { getToken, isTokenExpired, getNextProductId } from '$lib/storage';
	import { products } from '$lib/stores/storage.svelte';
	import type { Product } from '$lib/types';

	let showAddModal = false;
	let showEditModal = false;
	let editingProductId: string | null = null;
	let newProduct = { name: '', price: 0, category: 'Drinks', stock: 0 };
	let editProduct = { name: '', price: 0, category: 'Drinks', stock: 0 };

	onMount(() => {
		if (browser) {
			const token = getToken();
			if (!token || isTokenExpired(token)) {
				goto('/');
			}
		}
	});

	function addProduct() {
		if (newProduct.name && newProduct.price > 0) {
			const productId = getNextProductId();
			const product: Product = {
				id: productId,
				name: newProduct.name,
				price: newProduct.price,
				category: newProduct.category,
				stock: newProduct.stock,
				createdAt: new Date().toISOString()
			};
			products.add(product);
			showAddModal = false;
			newProduct = { name: '', price: 0, category: 'Drinks', stock: 0 };
		}
	}

	function toggleProduct(id: string) {
		const product = $products.find(p => p.id === id);
		if (product) {
			products.update(id, { stock: product.stock > 0 ? 0 : 1 });
		}
	}

	function openEditModal(id: string) {
		const product = $products.find((p) => p.id === id);
		if (product) {
			editingProductId = id;
			editProduct = {
				name: product.name,
				price: product.price,
				category: product.category,
				stock: product.stock
			};
			showEditModal = true;
		}
	}

	function saveEditedProduct() {
		if (editingProductId !== null && editProduct.name && editProduct.price > 0) {
			products.update(editingProductId, {
				name: editProduct.name,
				price: editProduct.price,
				category: editProduct.category,
				stock: editProduct.stock
			});
			showEditModal = false;
			editingProductId = null;
			editProduct = { name: '', price: 0, category: 'Drinks', stock: 0 };
		}
	}
</script>

<main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
		<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Products</h2>
			<button
				on:click={() => (showAddModal = true)}
				class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full sm:w-auto"
			>
				+ Add Product
			</button>
		</div>

		<div class="bg-white dark:bg-[#16213e] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 dark:bg-[#1a1a2e]">
						<tr>
							<th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
							<th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">product</th>
							<th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">category</th>
							<th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">price</th>
							<th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">stock</th>
							<th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">status</th>
							<th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">manage</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
						{#each $products as product}
							<tr class="hover:bg-gray-50 dark:hover:bg-[#1a1a2e]">
								<td class="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{product.id}</td>
								<td class="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</td>
								<td class="px-4 sm:px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{product.category}</td>
								<td class="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">฿{product.price}</td>
								<td class="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{product.stock}</td>
								<td class="px-4 sm:px-6 py-4">
									<button
										on:click={() => toggleProduct(product.id)}
										class="px-2 sm:px-3 py-1 text-xs font-medium rounded-full {(product.stock > 0)
											? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
											: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}"
									>
										{product.stock > 0 ? 'Active' : 'Inactive'}
									</button>
								</td>
								<td class="px-4 sm:px-6 py-4">
									<button
										on:click={() => openEditModal(product.id)}
										class="text-orange-500 hover:text-orange-700 text-sm font-medium"
									>
										edit
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</main>

	{#if showAddModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white dark:bg-[#16213e] p-6 rounded-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
				<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Add New Product</h3>

				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
						<input
							type="text"
							bind:value={newProduct.name}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
						<input
							type="number"
							bind:value={newProduct.price}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
						<select
							bind:value={newProduct.category}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100"
						>
							<option value="Drinks">Drinks</option>
							<option value="Food">Food</option>
							<option value="Snacks">Snacks</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
						<input
							type="number"
							bind:value={newProduct.stock}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100"
						/>
					</div>
				</div>

				<div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
					<button
						on:click={addProduct}
						class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
					>
						Save
					</button>
					<button
						on:click={() => (showAddModal = false)}
						class="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showEditModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white dark:bg-[#16213e] p-6 rounded-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
				<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Edit Product</h3>

				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
						<input
							type="text"
							bind:value={editProduct.name}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
						<input
							type="number"
							bind:value={editProduct.price}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
						<select
							bind:value={editProduct.category}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100"
						>
							<option value="Drinks">Drinks</option>
							<option value="Food">Food</option>
							<option value="Snacks">Snacks</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
						<input
							type="number"
							bind:value={editProduct.stock}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-gray-100"
						/>
					</div>
				</div>

				<div class="flex space-x-3 mt-6">
					<button
						on:click={saveEditedProduct}
						class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
					>
						Save
					</button>
					<button
						on:click={() => (showEditModal = false)}
						class="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

