// LnwPoS - Storage Wrapper (Cookies + LocalStorage)

import type {
  User,
  Product,
  Transaction,
  Settings,
} from './types.js'

const STORAGE_KEYS = {
  USER: 'lnwpos_user',
  PRODUCTS: 'lnwpos_products',
  TRANSACTIONS: 'lnwpos_transactions',
  SETTINGS: 'lnwpos_settings',
  TOKEN: 'lnwpos_token',
  NEXT_ID: 'lnwpos_next_id',
} as const

export { STORAGE_KEYS }

const TOKEN_EXPIRY_HOURS = 24

// ========== Cookie Functions ==========

export function setCookie(name: string, value: string, hours: number = 24): void {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  try {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=')
      if (cookieName === name) {
        return decodeURIComponent(cookieValue)
      }
    }
    return null
  } catch {
    return null
  }
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}

// ========== Helper Functions ==========

export function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

export function generateToken(username: string): string {
  const expiration = Math.floor(Date.now() / 1000) + (TOKEN_EXPIRY_HOURS * 60 * 60)
  return `${username}.${expiration}`
}

export function decodeToken(token: string): { username: string; expiration: number } | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const username = parts[0]
  const expiration = parseInt(parts[1], 10)
  if (isNaN(expiration)) return null
  return { username, expiration }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded) return true
  const currentTime = Math.floor(Date.now() / 1000)
  return currentTime >= decoded.expiration
}

export function getToken(): string | null {
  return getCookie(STORAGE_KEYS.TOKEN)
}

export function setToken(token: string): void {
  setCookie(STORAGE_KEYS.TOKEN, token, TOKEN_EXPIRY_HOURS)
}

export function removeToken(): void {
  deleteCookie(STORAGE_KEYS.TOKEN)
}

export function getStorageItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Failed to set ${key}:`, error)
  }
}

export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Failed to remove ${key}:`, error)
  }
}

export function clearStorageItem(key: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Failed to clear ${key}:`, error)
  }
}

export function getNextProductId(): string {
  const products = getProducts()
  let maxId = 0
  for (const product of products) {
    const numId = parseInt(product.id, 10)
    if (!isNaN(numId) && numId > maxId) {
      maxId = numId
    }
  }
  const nextId = maxId + 1
  return nextId.toString().padStart(5, '0')
}

// ========== Type-Specific Wrappers ==========

// User
export function getUser(): User | null {
  const userStr = getCookie(STORAGE_KEYS.USER)
  if (!userStr) return null
  try {
    return JSON.parse(userStr) as User
  } catch {
    return null
  }
}

export function setUser(user: User): void {
  setCookie(STORAGE_KEYS.USER, JSON.stringify(user), TOKEN_EXPIRY_HOURS)
}

export function removeUser(): void {
  deleteCookie(STORAGE_KEYS.USER)
}

export const DEFAULT_USER_EMAIL = 'user'
export const DEFAULT_USER_PASSWORD = 'password'
export const DEFAULT_USER_PASSWORD_HASH = simpleHash('password')

export function getOrCreateDefaultUser(): User | null {
  const existingUser = getUser()
  if (existingUser && existingUser.email === DEFAULT_USER_EMAIL) {
    return existingUser
  }
  const defaultUser: User = {
    id: 'user_default',
    email: DEFAULT_USER_EMAIL,
    passwordHash: DEFAULT_USER_PASSWORD_HASH,
    createdAt: new Date().toISOString(),
  }
  setUser(defaultUser)
  return defaultUser
}

// Products
export function getProducts(): Product[] {
  return getStorageItem<Product[]>(STORAGE_KEYS.PRODUCTS) || []
}

export function setProducts(products: Product[]): void {
  setStorageItem<Product[]>(STORAGE_KEYS.PRODUCTS, products)
}

export function addProduct(product: Product): void {
  const products = getProducts()
  products.push(product)
  setProducts(products)
}

export function updateProduct(id: string, updates: Partial<Product>): void {
  const products = getProducts()
  const index = products.findIndex(p => p.id === id)
  if (index !== -1) {
    products[index] = { ...products[index], ...updates }
    setProducts(products)
  }
}

export function deleteProduct(id: string): void {
  const products = getProducts().filter(p => p.id !== id)
  setProducts(products)
}

// Transactions
export function getTransactions(): Transaction[] {
  return getStorageItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || []
}

export function setTransactions(transactions: Transaction[]): void {
  setStorageItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, transactions)
}

export function addTransaction(transaction: Transaction): void {
  const transactions = getTransactions()
  transactions.unshift(transaction) // Add to beginning
  setTransactions(transactions)
}

export function updateTransactionStatus(
  id: string,
  status: Transaction['status'],
  paidAt?: string
): void {
  const transactions = getTransactions()
  const index = transactions.findIndex(t => t.id === id)
  if (index !== -1) {
    transactions[index] = {
      ...transactions[index],
      status,
      paidAt,
    }
    setTransactions(transactions)
  }
}

export function getTransactionsByStatus(
  status: Transaction['status']
): Transaction[] {
  return getTransactions().filter(t => t.status === status)
}

// Settings
export function getSettings(): Settings {
  return getStorageItem<Settings>(STORAGE_KEYS.SETTINGS) || {}
}

export function setSettings(settings: Partial<Settings>): void {
  const current = getSettings()
  setStorageItem<Settings>(STORAGE_KEYS.SETTINGS, { ...current, ...settings })
}

export function clearSettings(): void {
  removeStorageItem(STORAGE_KEYS.SETTINGS)
}