<script lang="ts" context="module">
// LnwPoS - Data Store (LocalStorage + Svelte 5)

import { writable, derived } from 'svelte/store'
import { browser } from '$app/environment'
import {
  getProducts,
  setProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getTransactions,
  setTransactions,
  addTransaction,
  updateTransactionStatus,
  getTransactionsByStatus,
} from '$lib/storage.js'
import type { Product, Transaction } from '$lib/types.js'

type ProductStoreType = Product[]
type TransactionStoreType = Transaction[]

// ========== Products Store ==========
function createProductsStore() {
  const { subscribe, update } = writable<ProductStoreType>([])

  function loadProducts() {
    if (!browser) return
    try {
      const products = getProducts()
      update(() => products)
    } catch (error) {
      console.error('Failed to load products:', error)
      update(() => [])
    }
  }

  // Initial load
  loadProducts()

  return {
    subscribe,
    load: loadProducts,
    add: (product: Product) => {
      addProduct(product)
      loadProducts()
    },
    update: (id: string, updates: Partial<Product>) => {
      updateProduct(id, updates)
      loadProducts()
    },
    delete: (id: string) => {
      deleteProduct(id)
      loadProducts()
    },
    getAll: () => getProducts(),
  }
}

export const products = createProductsStore()

// ========== Transactions Store ==========
function createTransactionsStore() {
  const { subscribe, update } = writable<TransactionStoreType>([])

  function loadTransactions() {
    if (!browser) return
    try {
      const transactions = getTransactions()
      update(() => transactions)
    } catch (error) {
      console.error('Failed to load transactions:', error)
      update(() => [])
    }
  }

  // Initial load
  loadTransactions()

  return {
    subscribe,
    load: loadTransactions,
    add: (transaction: Transaction) => {
      addTransaction(transaction)
      loadTransactions()
    },
    updateStatus: (id: string, status: Transaction['status'], paidAt?: string) => {
      updateTransactionStatus(id, status, paidAt)
      loadTransactions()
    },
    getByStatus: (status: Transaction['status']) => getTransactionsByStatus(status),
    getAll: () => getTransactions(),
  }
}

export const transactions = createTransactionsStore()

// ========== Derived Stores ==========

// Transactions count
export const totalTransactions = derived(transactions, $transactions =>
  $transactions.length
)

// Paid transactions count
export const paidTransactions = derived(transactions, $transactions =>
  $transactions.filter(t => t.status === 'paid').length
)

// Pending transactions count
export const pendingTransactions = derived(transactions, $transactions =>
  $transactions.filter(t => t.status === 'pending').length
)

// Total sales (sum of paid transactions)
export const totalSales = derived(transactions, $transactions => {
  return $transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + t.total, 0)
})
</script>
