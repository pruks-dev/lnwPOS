# ⚡ LnwPoS - Bitcoin Lightning Point of Sale

A secure, Point of Sale system built with SvelteKit, Svelte 5, and LocalStorage. Perfect for small businesses accepting Bitcoin payments via Lightning Network.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![Svelte](https://img.shields.io/badge/Svelte-5-orange.svg)

## Features

### 🔐 Authentication
- Secure client-side authentication with LocalStorage
- Cookie-based token storage (24-hour expiry)
- SSR-compatible route protection
- Session management and auto-expiry
- Default credentials: `user` / `password`

### 📊 Dashboard
- Today's sales overview with totals
- Transaction statistics and charts
- Recent transaction history feed
- Bitcoin exchange rate display (configurable)
- Pending transaction tracking
- Sales by payment method breakdown

### 🛒 Point of Sale
- Add products to cart with one click
- Multiple payment methods (Cash, PromptPay, Lightning, LNURL, Cashu)
- Real-time cart total calculation
- Quick checkout with invoice generation
- Multi-line items support for complex orders

### 📦 Product Management
- Create, edit, and delete products
- Stock management (on/off toggle)
- Sequential product IDs (00001, 00002, ...)
- Product categories with emoji icons
- Custom product images
- Category-based product organization

### 📋 Transaction History
- View all transactions with full details
- Filter by payment method (Cash, PromptPay, Lightning, LNURL, Cashu)
- Filter by status (Success, Pending, Failed)
- Transaction details with timestamps
- Invoice and memo details for Lightning payments
- Search and filter functionality

### 🎨 User Interface
- Fully responsive design (mobile + desktop)
- Dark/Light theme toggle
- English localization
- Modern, clean UI with Tailwind CSS
- Smooth animations and transitions
- Intuitive navigation

## Tech Stack

| Technology | Version |
|------------|---------|
| SvelteKit | 2.x |
| Svelte | 5.x |
| TypeScript | 5.x |
| Tailwind CSS | 3.x |
| Vite | 7.x |
| LocalStorage API | Native |

## Architecture

### Storage Layer
All data is persisted in the browser's LocalStorage, making the application:
- **Offline-capable** - Works without internet once loaded
- **Privacy-focused** - No backend database required
- **Fast** - Instant load and data access
- **No server maintenance** - No database to manage

### Data Types

#### Products
```typescript
{
  id: string        // Sequential: 00001, 00002, ...
  name: string
  price: number
  category: string
  image?: string
  stock: number     // 1 = in stock, 0 = out of stock
  createdAt: string
}
```

#### Transactions
```typescript
{
  id: string
  items: TransactionItem[]
  total: number
  paymentMethod: 'cash' | 'promptpay' | 'lnurl' | 'cashu' | 'lightning'
  status: 'paid' | 'pending' | 'failed'
  invoice?: string  // Lightning invoice
  memo?: string     // Payment memo
  paidAt?: string
  createdAt: string
}
```

#### Settings
```typescript
{
  lightningAddress?: string  // Your lightning@address
  openPlebApiKey?: string    // For Bitcoin price updates
  cashuMint?: string         // Cashu mint URL
  currency?: 'sat' | 'btc'   // Price display currency
  taxRate?: number           // Tax percentage (optional)
}
```

#### Authentication
```typescript
// Cookie: lnwpos_user
{
  id: string
  email: string
  passwordHash: string
  createdAt: string
}

// Cookie: lnwpos_token
value: "username.timestamp"  // 24-hour expiry
```

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pruks-dev/lnwPOS.git
   cd lnwPOS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## Usage

### First-Time Setup

1. Login with default credentials
   - Email: `user`
   - Password: `password`

2. (Optional) Add products via Products page
   - Click "Add Product" to create new products
   - Configure categories and pricing
   - Set stock availability

### Making a Sale

1. Navigate to **POS** page
2. Click products to add to cart (supports multiple quantities)
3. Select payment method (Cash/PromptPay/Lightning/LNURL/Cashu)
4. Click "Checkout" button
5. Confirm payment
6. Transaction is saved to LocalStorage immediately

### Managing Products

1. Navigate to **Products** page
2. Click "Add Product" to create new product
3. Click product to toggle stock status (on/off)
4. Click edit icon to modify product details
5. Click delete icon to remove product
6. Product ID auto-generates sequentially

### Viewing Transactions

1. Navigate to **Transactions** page
2. Filter by payment method (Cash, PromptPay, Lightning, LNURL, Cashu)
3. Filter by status (Paid, Pending, Failed)
4. View transaction details with items, totals, and timestamps

### Configuring Settings

1. Navigate to **Settings** page
2. Configure Lightning address for price updates
3. Set Cashu mint URL for Cashu payments
4. Choose currency (satoshi or BTC)
5. Optionally configure tax rate

## Authentication System

The application uses a secure client-side authentication system with SSR protection:

### How It Works
- **Login**: POST to `/api/auth/login`
- **Logout**: POST to `/api/auth/logout`
- **Token Storage**: Cookies (not LocalStorage) - SSR-safe
- **Token Format**: `username.timestamp`
- **Expiration**: 24 hours (configurable)
- **Password Hashing**: Simple hash function (TODO: upgrade to bcrypt/argon2)

### Session Management
- Token automatically expires after 24 hours
- User is logged out after token expiration
- Session persists across page refreshes within token validity
- SSR-safe route protection prevents unauthorized access

## Payment Methods

### Cash
- Accept cash payments directly
- No verification needed
- Status: `paid`
- Simple and instant

### PromptPay
- QR code for customer payment
- Shop PromptPay ID configured in Settings
- Status: `paid`

### Lightning (LNURL/Cashu)
- Generate Lightning invoice or LNURL
- QR code scanning for payment
- Supports:
  - **LNURL**: Lightning Network URL for payments
  - **Cashu**: Decentralized micro-credentials (unspent tokens)
- Status: `paid` | `pending` | `failed`
- Displays Bitcoin price in satoshi/BTC
- Real-time price updates (via OpenPleb API)

## Data Persistence

### LocalStorage Keys
- `lnwpos_products` - All products data
- `lnwpos_transactions` - All transactions data
- `lnwpos_settings` - Application settings
- `lnwpos_user` - Current user session
- `lnwpos_token` - Authentication token
- `lnwpos_next_id` - Next sequential product ID

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)

**Note**: LocalStorage-based storage requires JavaScript to be enabled.

## Development

### Build for Production

```bash
npm run build
npm run preview
```

### TypeScript Compilation

```bash
npm run build  # Validates TypeScript types
```

### Development Tips
- Use `npm run dev` for hot reload development
- `npm run check` validates Svelte components
- Data persists in browser during development

## Security Considerations

⚠️ **Important Notes:**

### Current Limitations
- **Client-side only** - No server-side validation
- **LocalStorage** - Susceptible to browser extensions attacks
- **Password hashing** - Simple hash 
- **No CSRF protection** - CSRF tokens not implemented
- **No rate limiting** - No API rate limiting

### Suitable For
- ✅ Small businesses and sole proprietorships
- ✅ Testing and prototyping
- ✅ Teaching and learning


## Roadmap

### ✅ Complete (Phase 1)
- [x] LocalStorage layer (products, transactions, users, settings)
- [x] Client-side authentication with cookie tokens
- [x] POS with cart and multi-item support
- [x] Product management (CRUD operations)
- [x] Transaction history with filters
- [x] Dashboard with analytics
- [x] Dark/Light theme toggle
- [x] Responsive design (mobile + desktop)

### 🚀 Future (Phase 2) - Enhanced Features
- [ ] Lightning integration (LNURL + OpenPleb API)
- [ ] Receipt generation (print/export)
- [ ] Inventory alerts (low stock notifications)
- [ ] Data backup and export features
- [ ] Multiple currency support

### 🚀 Future (Phase 3) - Advanced Features
- [ ] Advanced cart management (quantities, modifiers, discounts)
- [ ] Receipt generation (print/export PDF/QR)
- [ ] Inventory alerts (low stock notifications)
- [ ] Data backup and export (JSON/CSV)
- [ ] Multi-device sync
- [ ] User management system
- [ ] POS hardware support (thermal printer)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - Feel free to use this project for personal or commercial purposes.

## Credits

Built with ❤️ using:
- [SvelteKit](https://kit.svelte.dev/)
- [Svelte](https://svelte.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

---

**Made with Bitcoin ⚡**
