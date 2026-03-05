// LnwPoS - Mock Data (Client-side only)

import { setProducts, setTransactions, clearStorageItem, STORAGE_KEYS } from './storage.js'
import type { Product, Transaction, TransactionItem } from './types.js'

let idCounter = 1 // Start at 1 for 00001 format

export function generateId(): string {
  idCounter++
  return idCounter.toString().padStart(5, '0')
}

export const mockProducts: Product[] = [
  {
    id: '00001', // Pre-seeded first ID
    // Will be updated on init
    name: 'Coffee',
    price: 45,
    category: 'coffee',
    stock: 100,
    createdAt: new Date().toISOString(),
  },
  {
    id: '00002',
    name: 'Latte',
    price: 50,
    category: 'coffee',
    stock: 100,
    createdAt: new Date().toISOString(),
  },
  {
    id: '00003',
    name: 'Mocha',
    price: 55,
    category: 'coffee',
    stock: 100,
    createdAt: new Date().toISOString(),
  },
  {
    id: '00004',
    name: 'Espresso',
    price: 40,
    category: 'coffee',
    stock: 100,
    createdAt: new Date().toISOString(),
  },
  {
    id: '00005',
    name: 'Milk',
    price: 20,
    category: 'other',
    stock: 50,
    createdAt: new Date().toISOString(),
  },
]

function createMockTransaction(
  productNames: string[],
  productPrices: number[],
  quantities: number[],
  paymentMethod: 'lnurl' | 'cashu',
  status: 'paid' | 'pending' | 'failed',
  hoursAgo: number
): Transaction {
  const items: TransactionItem[] = productNames.map((name, index) => ({
    product: {
      id: generateId(),
      name,
      price: productPrices[index],
      category: 'coffee',
      stock: 100,
      createdAt: new Date().toISOString(),
    },
    quantity: quantities[index],
    subtotal: productPrices[index] * quantities[index],
  }))

  const total = items.reduce((sum, item) => sum + item.subtotal, 0)
  const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

  return {
    id: generateId(),
    items,
    total,
    paymentMethod,
    status,
    invoice: `inv_${generateId()}`,
    memo: `Transaction ${status}`,
    paidAt: status === 'paid' ? createdAt : undefined,
    createdAt,
  }
}

export const mockTransactions: Transaction[] = [
  createMockTransaction(
    ['Coffee', 'Latte'],
    [45, 50],
    [2, 1],
    'cashu',
    'paid',
    0.5
  ),
  createMockTransaction(
    ['Mocha', 'Milk'],
    [55, 20],
    [1, 2],
    'lnurl',
    'paid',
    1.5
  ),
  createMockTransaction(
    ['Espresso'],
    [40],
    [3],
    'cashu',
    'paid',
    2
  ),
  createMockTransaction(
    ['Coffee', 'Mocha'],
    [45, 55],
    [1, 1],
    'lnurl',
    'paid',
    3
  ),
  createMockTransaction(
    ['Latte', 'Milk'],
    [50, 20],
    [2, 1],
    'cashu',
    'paid',
    4
  ),
  createMockTransaction(
    ['Coffee'],
    [45],
    [1],
    'lnurl',
    'pending',
    5
  ),
  createMockTransaction(
    ['Mocha', 'Espresso'],
    [55, 40],
    [1, 1],
    'cashu',
    'paid',
    6
  ),
  createMockTransaction(
    ['Milk'],
    [20],
    [4],
    'lnurl',
    'failed',
    7
  ),
]

export interface MockStats {
  totalSalesToday: number
  transactionsToday: number
  pendingBalance: number
}

export function calculateMockStats(transactions: Transaction[]): MockStats {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStart = today.getTime()

  const todayTransactions = transactions.filter(t => {
    const txDate = new Date(t.createdAt).getTime()
    return txDate >= todayStart
  })

  const totalSalesToday = todayTransactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + t.total, 0)

  const transactionsToday = todayTransactions.filter(t => t.status === 'paid').length

  const pendingBalance = todayTransactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.total, 0)

  return {
    totalSalesToday,
    transactionsToday,
    pendingBalance,
  }
}

export function initializeMockupData() {
  if (typeof window === 'undefined') return { success: false, message: 'Browser required' }

  try {
    clearStorageItem(STORAGE_KEYS.PRODUCTS)
    clearStorageItem(STORAGE_KEYS.TRANSACTIONS)

    idCounter = mockProducts.length // Continue from last mock product ID

    setProducts(mockProducts)
    setTransactions(mockTransactions)

    const stats: MockStats = calculateMockStats(mockTransactions)

    return {
      success: true,
      message: 'Mockup data initialized successfully',
      data: {
        productsCount: mockProducts.length,
        transactionsCount: mockTransactions.length,
        stats,
      },
    }
  } catch (error) {
    console.error('Failed to initialize mock data:', error)
    return {
      success: false,
      message: 'Failed to initialize mock data',
    }
  }
}