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
  btcToThbRate?: number
  bondExpirationHours?: number
}

// ========== Store Types ==========
export interface ProductStore extends Product {}
export interface TransactionStore extends Transaction {}

// ========== OpenPleb Types ==========
export type OfferStatus = 
	| 'CREATED'
	| 'INVOICE_CREATED'
	| 'INVOICE_PAID'
	| 'CLAIMED'
	| 'RECEIPT_SUBMITTED'
	| 'PAID_WITH_TOKEN'
	| 'COMPLETED'
	| 'EXPIRED'
	| 'DISPUTED'
	| 'RESOLVED'
	| 'ERROR';

export interface OpenPlebOffer {
	id: number;
	createdAt: number;
	amount: number;
	qrCode?: string;
	conversionRate: number;
	satsAmount: number;
	status: OfferStatus;
	pubkey: string;
	invoice?: string;
	validForS: number;
	currency: string;
	fiatProviderId?: number;
	bondFlatRate: number;
	bondPercentage: number;
	bond?: number;
	mintUrl?: string;
}

export interface OpenPlebSettings {
	OPENPLEB_PLATFORM_FEE_PERCENTAGE: number;
	OPENPLEB_PLATFORM_FEE_FLAT_RATE: number;
	OPENPLEB_TAKER_FEE_PERCENTAGE: number;
	OPENPLEB_TAKER_FEE_FLAT_RATE: number;
	OPENPLEB_BOND_PERCENTAGE: number;
	OPENPLEB_BOND_FLAT_RATE: number;
	OPENPLEB_CURRENCY: string;
	OPENPLEB_MAX_FIAT_AMOUNT: number;
	OPENPLEB_MINT_URL: string;
}

export interface OpenPlebConfig {
	apiKey: string;
	apiUrl: string;
	pubkey: string;
	privkeyEncrypted: string;
	mintUrl: string;
	enabled: boolean;
}