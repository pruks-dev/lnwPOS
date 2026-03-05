// LnwPoS - TypeScript Types

// ========== User ==========
export interface User {
  id: string
  email: string
  passwordHash: string // TODO: Use proper hashing (bcrypt/argon2)
  createdAt: string
}

// ========== Product ==========
export interface Product {
  id: string
  name: string
  price: number
  category: string
  image?: string
  stock: number
  createdAt: string
}

// ========== Transaction Item ==========
export interface TransactionItem {
  product: Product
  quantity: number
  subtotal: number
}

// ========== Transaction ==========
export interface Transaction {
  id: string
  items: TransactionItem[]
  total: number
  paymentMethod: 'lnurl' | 'cashu' | 'cash' | 'promptpay' | 'lightning'
  status: 'pending' | 'paid' | 'failed'
  invoice?: string
  memo?: string
  paidAt?: string
  createdAt: string
}

// ========== Settings ==========
export interface Settings {
  lightningAddress?: string
  openPlebApiKey?: string
  cashuMint?: string
  currency?: 'sat' | 'btc'
  taxRate?: number // Percentage
}

// ========== Store Types ==========
export interface ProductStore extends Product {}
export interface TransactionStore extends Transaction {}