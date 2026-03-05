# ⚡ LnwPoS - Bitcoin Lightning Point of Sale

A secure, offline-capable Point of Sale system built with Next.js, Svelte 5, and LocalStorage. Perfect for small businesses accepting Bitcoin payments via Lightning Network.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![Svelte](https://img.shields.io/badge/Svelte-5-orange.svg)

## Features

### 🛒 Point of Sale
- Add products to cart
- Multiple payment methods (Cash, PromptPay, Lightning)
- Real-time cart total calculation
- Quick checkout with invoice generation

### 📦 Product Management
- Create, edit, and delete products
- Stock management
- Sequential product IDs (00001, 00002, ...)
- Product categories with emoji icons

### 📊 Dashboard
- Today's sales overview
- Transaction statistics
- Recent transaction history
- Bitcoin exchange rate display

### 📋 Transaction History
- View all transactions
- Filter by payment method (Cash, PromptPay, Lightning, LNURL, Cashu)
- Filter by status (Success, Pending, Failed)
- Transaction details with timestamps

### 🔐 Authentication
- Secure client-side authentication
- JWT token with cookie storage (24-hour expiry)
- SSR-compatible protected routes
- Default credentials: `user` / `password`

### 🎨 User Interface
- Fully responsive design (mobile + desktop)
- Dark/Light theme toggle
- English localization
- Modern, clean UI with Tailwind CSS

## Tech Stack

| Technology | Version |
|------------|---------|
| Next.js | 14.x |
| React | 18.x |
| TypeScript | 5.x |
| Svelte 5 | 5.x |
| Svelte Stores | 5.x |
| Tailwind CSS | 3.x |
| Vite | 5.x |

## Local Storage Data

### Products
```typescript
{
  id: string        // Sequential: 00001, 00002, ...
  name: string
  price: number
  category: string
  stock: number
  createdAt: string
}
```

### Transactions
```typescript
{
  id: string
  items: TransactionItem[]
  total: number
  paymentMethod: 'cash' | 'promptpay' | 'lnurl' | 'cashu'
  status: 'paid' | 'pending' | 'failed'
  invoice: string | undefined
  memo: string
  paidAt: string | undefined
  createdAt: string
}
```

### Authentication
```typescript
// Cookie: lnwpos_user
username: string

// Cookie: lnwpos_token
value: "username.expiration"  // 24-hour expiry
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

3. (Optional) Click "Load Mockup Data" in Settings to initialize sample data

### Making a Sale

1. Navigate to **POS** page
2. Click products to add to cart
3. Select payment method (Cash/PromptPay/Lightning)
4. Click "Checkout" button
5. Confirm payment
6. Transaction is saved to localStorage

### Managing Products

1. Navigate to **Products** page
2. Click "Add Product" to create new product
3. Click product to toggle stock status (on/off)
4. Click edit icon to modify product details
5. Click delete icon to remove product

### Viewing Transactions

1. Navigate to **Transactions** page
2. Filter by payment method
3. Filter by status
4. View transaction details

## Authentication

The application uses client-side authentication with SSR protection:

- **Login**: `/api/auth/login`
- **Logout**: `/api/auth/logout`
- **Token Storage**: Cookies (not localStorage)
- **Token Format**: `username.timestamp`
- **Default User**: `user` / `password`

### Creating Additional Users

Add users in `src/lib/storage.ts`:
```typescript
const USERS = [
  { email: 'admin', password: hash('admin123') },
  // ... more users
]
```

## Payment Methods

### Cash
- Accept cash payments directly
- No verification needed
- Status: `paid`

### PromptPay
- QR code for customer payment
- Shop PromptPay ID configured in Settings
- Status: `paid`

### Lightning (LNURL/Cashu)
- Generate Lightning invoice
- QR code scanning
- Supports:
  - **LNURL**: Lightning Network URL
  - **Cashu**: Decentralized micro-credentials
- Status: `paid` | `pending` | `failed`

## Environment Variables

Create `.env.local` for production configuration:

```env
# Database (if needed for future expansion)
DATABASE_URL=

# Bitcoin API
NEXT_PUBLIC_BITCOIN_RATE=3450

# Notification settings
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Note**: LocalStorage-based storage requires JavaScript to be enabled.

## Development

### Build for Production

```bash
npm run build
npm start
```

### TypeScript Compilation

```bash
npm run build  # Validates TypeScript
```

## Security Considerations

⚠️ **Important:**
- This is a client-side application using LocalStorage
- Not suitable for high-security environments
- Consider backend integration for:
  - Persistent storage
  - User management
  - Multi-device sync
  - Audit logs

## Roadmap

### Phase 1: ✅ Complete
- [x] LocalStorage layer
- [x] Client-side authentication
- [x] POS with cart
- [x] Product management
- [x] Transaction history
- [x] Dashboard with analytics
- [x] Mock data initialization
- [x] English localization

### Phase 2: ⏳ Planned
- [ ] Backend API integration
- [ ] Real database (PostgreSQL/SQLite)
- [ ] Multi-device sync
- [ ] User management system
- [ ] Receipt generation
- [ ] Inventory alerts
- [ ] Multiple shop management

### Phase 3: 🚀 Future
- [ ] Online payments integration (Coinbase, Binance)
- [ ] Real-time analytics dashboard
- [ ] Export transactions (CSV, PDF)
- [ ] Mobile app (React Native)
- [ ] POS hardware support (thermal printer)

## License

MIT License - Feel free to use this project for personal or commercial purposes.

## Credits

Built with ❤️ using:
- [Next.js](https://nextjs.org/)
- [Svelte 5](https://svelte.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Made with Bitcoin ⚡**
