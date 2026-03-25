# OpenPleb API Documentation

This document describes all open (public) API endpoints that don't require authentication.

Base URL: `/api/v1`

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/conversion` | Get BTC/fiat conversion rate |
| GET | `/envsettings` | Get environment settings |
| GET | `/data/:pubkey` | Get user data by pubkey |
| GET | `/data/for/:id` | Get data by offer ID |
| GET | `/offers` | List available offers (INVOICE_PAID status) |
| POST | `/offers` | Create new offer (Maker = Seller) |
| GET | `/offers/:id/checkpaidinvoice` | Check if maker's Lightning invoice is paid |
| GET | `/offers/:id/createinvoice` | Create Lightning invoice for maker's bond |
| POST | `/offers/:id/paywithtoken` | Maker pays with Cashu token (alternative to Lightning) |
| POST | `/offers/:id/feedback` | Submit feedback for offer |
| POST | `/offers/:id/counterorforfeit` | Respond to dispute |
| POST | `/offers/:id/claim` | Taker claims offer (provides Cashu bond) |
| GET | `/offers/:id/receipt` | Get receipt |
| POST | `/offers/:id/receipt` | Taker submits fiat payment receipt |
| GET | `/fiat-providers` | List fiat providers |
| GET | `/fiat-providers/:id` | Get specific provider |
| GET | `/vapid` | Get VAPID public key |
| POST | `/subscribe` | Subscribe to push notifications |
| WS | `/ws` | WebSocket for real-time updates |

---

## GET `/conversion`

Get the current BTC/fiat conversion rate.

**Response:**
```json
{
  "conversion": 45000000.00
}
```

---

## GET `/envsettings`

Get environment configuration (fees, limits, currency).

**Response:**
```json
{
  "env": {
    "OPENPLEB_PLATFORM_FEE_PERCENTAGE": 0.5,
    "OPENPLEB_PLATFORM_FEE_FLAT_RATE": 10,
    "OPENPLEB_TAKER_FEE_PERCENTAGE": 0.5,
    "OPENPLEB_TAKER_FEE_FLAT_RATE": 5,
    "OPENPLEB_BOND_PERCENTAGE": 5,
    "OPENPLEB_BOND_FLAT_RATE": 100,
    "OPENPLEB_CURRENCY": "USD",
    "OPENPLEB_MAX_FIAT_AMOUNT": 100000,
    "OPENPLEB_MINT_URL": "https://..."
  }
}
```

---

## GET `/data/:pubkey`

Get all data for a specific user by their public key. Returns offers created by the user, claims made, receipts, and available fiat providers.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| pubkey | path (string) | User's public key |

**Response:**
```json
{
  "offers": [
    {
      "id": 12345,
      "createdAt": 1700000000,
      "amount": 10000,
      "qrCode": "...",
      "conversionRate": 45000000,
      "platformFeeFlatRate": 10,
      "takerFeeFlatRate": 5,
      "takerFeePercentage": 0,
      "platformFeePercentage": 0,
      "bondFlatRate": 100,
      "bondPercentage": 5,
      "satsAmount": 234,
      "status": "CREATED",
      "pubkey": "npub...",
      "invoice": null,
      "paidAt": null,
      "validForS": 120,
      "currency": "USD",
      "feedback": null,
      "feedbackResponse": null,
      "resolutionReason": null,
      "description": null,
      "refund": null,
      "fiatProviderId": 1
    }
  ],
  "claims": [
    {
      "id": 1,
      "createdAt": 1700000000,
      "pubkey": "npub...",
      "offerId": 12345,
      "reward": "..."
    }
  ],
  "receipts": [
    {
      "id": 1,
      "createdAt": 1700000000,
      "pubkey": "npub...",
      "receiptImg": "...",
      "offerId": 12345
    }
  ],
  "fiatProviders": [
    {
      "id": 1,
      "label": "Bank of Korea",
      "icon": "data:image/...",
      "matchTemplate": "...",
      "createdAt": 1700000000
    }
  ],
  "env": { ... }
}
```

---

## GET `/data/for/:id`

Get detailed data for a specific offer by ID. Includes the offer, associated claim, receipt, and user info for both maker and taker.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | path (number) | Offer ID |

**Response:**
```json
{
  "offer": {
    "id": 12345,
    "createdAt": 1700000000,
    "amount": 10000,
    "qrCode": "...",
    "conversionRate": 45000000,
    "platformFeeFlatRate": 10,
    "takerFeeFlatRate": 5,
    "takerFeePercentage": 0,
    "platformFeePercentage": 0,
    "bondFlatRate": 100,
    "bondPercentage": 5,
    "satsAmount": 234,
    "status": "CREATED",
    "pubkey": "npub...",
    "invoice": null,
    "paidAt": null,
    "validForS": 120,
    "currency": "USD",
    "fiatProviderId": 1
  },
  "claim": {
    "id": 1,
    "createdAt": 1700000000,
    "pubkey": "npub_taker...",
    "offerId": 12345,
    "reward": "..."
  },
  "receipt": {
    "id": 1,
    "createdAt": 1700000000,
    "pubkey": "npub_taker...",
    "receiptImg": "...",
    "offerId": 12345
  },
  "makerInfo": {
    "pubkey": "npub_maker...",
    "numberOfOffers": 10,
    "numberOfClaims": 5,
    "reviewsGiven": 0,
    "reviewsReceived": 0,
    "reviewScore": 0
  },
  "takerInfo": {
    "pubkey": "npub_taker...",
    "numberOfOffers": 3,
    "numberOfClaims": 8,
    "reviewsGiven": 0,
    "reviewsReceived": 0,
    "reviewScore": 0
  }
}
```

If offer not found:
```json
{
  "offer": undefined,
  "claim": undefined,
  "receipt": undefined
}
```

---

## GET `/offers`

Placeholder endpoint. Returns "hello".

**Response:**
```
hello
```

---

## POST `/offers`

Create a new offer. The maker creates an offer to pay a banking QR code with Bitcoin.

**Request:**
```json
{
  "qrCode": "string (banking QR code data)",
  "amount": "number (fiat amount)",
  "fiatProviderId": "number (optional)",
  "pubkey": "string (user's pubkey)",
  "token": "string (optional)"
}
```

**Validation:**
- `amount` must be positive
- `amount` must not exceed `OPENPLEB_MAX_FIAT_AMOUNT`
- `qrCode` and `pubkey` are required

**Response (success):**
```json
{
  "offer": {
    "id": 12345,
    "createdAt": 1700000000,
    "amount": 10000,
    "qrCode": "...",
    "conversionRate": 45000000,
    "platformFeeFlatRate": 10,
    "takerFeeFlatRate": 5,
    "takerFeePercentage": 0,
    "platformFeePercentage": 0,
    "bondFlatRate": 100,
    "bondPercentage": 5,
    "satsAmount": 234,
    "status": "CREATED",
    "pubkey": "npub...",
    "invoice": null,
    "paidAt": null,
    "validForS": 120,
    "currency": "USD",
    "fiatProviderId": 1
  }
}
```

**Error responses:**
- 400: "Invalid request" - missing required fields
- 400: "Invalid amount" - amount is not positive
- 400: "Amount exceeds maximum allowed: {max} {currency}"
- 500: "Could not fetch conversion rate"

---

## GET `/offers/:id/checkpaidinvoice`

Check if the invoice for an offer has been paid.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | path (number) | Offer ID |

**Response:**
```json
{
  "state": "PENDING" | "PAID" | "EXPIRED"
}
```

**Error responses:**
- 400: "Invalid request" - missing ID
- 400: "Invalid offer ID" - ID is not a number
- 404: "Claim not found" - no mint quote for this offer

---

## GET `/offers/:id/createinvoice`

Create a Lightning invoice for the offer's bond amount.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | path (number) | Offer ID |

**Response:** Returns created invoice object (implementation detail - typically creates a mint quote).

---

## POST `/offers/:id/feedback`

Submit feedback for a completed trade. This is used after a trade is completed to rate the counterparty.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | path (number) | Offer ID |

**Request:**
```json
{
  "payload": {
    "status": "positive" | "negative",
    "feedback": "User feedback message"
  },
  "nonce": "string",
  "timestamp": 1700000000,
  "signature": "string (cryptographic signature)"
}
```

---

## POST `/offers/:id/counterorforfeit`

Respond to a dispute. The maker can either forfeit their bond or counter the dispute.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | path (number) | Offer ID |

**Request:**
```json
{
  "payload": {
    "response": "FORFEIT" | "COUNTER",
    "message": "Response message"
  },
  "nonce": "string",
  "timestamp": 1700000000,
  "signature": "string"
}
```

---

## POST `/offers/:id/claim`

Claim an offer. The taker claims an offer by providing a bond (Cashu token).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | path (number) | Offer ID |

**Request:**
```json
{
  "pubkey": "string (taker's pubkey)",
  "bond": "string (Cashu token as bond)"
}
```

**Response:** Returns created claim object.

---

## Roles

- **Maker** = Seller (has Bitcoin, wants fiat)
- **Taker** = Buyer (has fiat, wants Bitcoin)

---

## POST `/offers/:id/paywithtoken`

Pay for an offer using Cashu ecash tokens. This is an **alternative to Lightning invoice** for the maker to prove they have Bitcoin.

Maker can provide their Bitcoin in two ways:
1. **Lightning invoice** (`POST /offers/:id/createinvoice` + pay externally)
2. **Cashu token** (this endpoint) - send Cashu ecash directly

This is used when the maker (seller) wants to pay with Cashu instead of Lightning.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | path (number) | Offer ID |

**Request:**
```json
{
  "token": "string (Cashu ecash token)"
}
```

**Token amount must equal:** `satsAmount + platformFee + takerFee + bond`

---

## GET `/offers/:id/receipt`

Get the receipt for a specific offer.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | path (number) | Offer ID |

**Response:** Returns receipt object if exists.

---

## POST `/offers/:id/receipt`

Submit a payment receipt. The taker submits proof of fiat payment to the maker.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | path (number) | Offer ID |

**Request:**
```json
{
  "receipt": "string (receipt image/data)",
  "pubkey": "string (taker's pubkey)"
}
```

---

## GET `/fiat-providers`

List all available fiat providers (banks/payment services).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "label": "Bank of Korea",
      "icon": "data:image/...",
      "matchTemplate": "...",
      "createdAt": 1700000000
    },
    {
      "id": 2,
      "label": "Shinhan Bank",
      "icon": "data:image/...",
      "matchTemplate": "...",
      "createdAt": 1700000000
    }
  ],
  "message": "Fiat providers fetched successfully"
}
```

**Error (500):**
```json
{
  "success": false,
  "message": "Error message",
  "data": null
}
```

---

## GET `/fiat-providers/:id`

Get a specific fiat provider by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | path (number) | Provider ID |

**Response (success):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "label": "Bank of Korea",
    "icon": "data:image/...",
    "matchTemplate": "...",
    "createdAt": 1700000000
  },
  "message": "Fiat provider fetched successfully"
}
```

**Error (400 - invalid ID):**
```json
{
  "success": false,
  "message": "Invalid provider ID",
  "data": null
}
```

**Error (404 - not found):**
```json
{
  "success": false,
  "message": "Fiat provider not found",
  "data": null
}
```

---

## GET `/vapid`

Get VAPID public key for browser push notifications.

**Response:**
```json
{
  "publicKey": "base64url-encoded-public-key"
}
```

---

## POST `/subscribe`

Subscribe to push notifications for new offers.

**Request:**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "expirationTime": null,
    "keys": {
      "p256dh": "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIGBQgXY...",
      "auth": "tBHItJI5svbpez7KI4CCXg=="
    }
  }
}
```

**Response:** Returns 200 OK on success.

**Error (400):**
```json
{
  "success": false,
  "message": "Error message",
  "data": null
}
```

---

## WebSocket `/ws`

Real-time WebSocket connection for live updates. No authentication required.

### Connection

**URL:** `ws://localhost:3000/api/v1/ws`

**Headers (optional):**
- `Sec-WebSocket-Protocol`: User's pubkey (for personalized updates)

### Outgoing Messages (Server -> Client)

**Ping:**
```json
{
  "command": "ping",
  "data": {
    "takers": 5,
    "makers": 10,
    "price": 45000000
  }
}
```

**New Offer:**
```json
{
  "command": "new-offer",
  "data": {
    "offer": {
      "id": 12345,
      "amount": 10000,
      "satsAmount": 234,
      "status": "CREATED",
      ...
    }
  }
}
```

### Incoming Messages (Client -> Server)

**Pong (user presence):**
```json
{
  "command": "pong",
  "data": {
    "pubkey": "npub...",
    "mode": "pay" | "earn"
  }
}
```

The server sends ping messages every 5 seconds. Clients should respond with a pong message containing their pubkey and mode ("pay" if they want to make offers, "earn" if they want to take offers).

---

## Offer States

| State | Description |
|-------|-------------|
| `CREATED` | Offer just created, waiting for taker |
| `INVOICE_CREATED` | Invoice generated for bond, waiting for payment |
| `INVOICE_PAID` | Bond paid, taker can now claim |
| `CLAIMED` | Taker claimed the offer |
| `EXPIRED` | Offer expired without being claimed |
| `COMPLETED` | Successfully completed |
| `RECEIPT_SUBMITTED` | Taker submitted payment receipt |
| `MARKED_WITH_ISSUE` | Issue reported by maker |
| `FOREFEIT` | Bond forfeited |
| `DISPUTED` | Under dispute |
| `RESOLVED` | Dispute resolved |
| `ERROR` | Error occurred |

---

## Dispute Response Types

| Type | Description |
|------|-------------|
| `FORFEIT` | Maker forfeits their bond |
| `COUNTER` | Maker counters the dispute |

---

## Resolution Paths

| Path | Description |
|------|-------------|
| `MAKER_WINS` | Resolution favors the maker |
| `TAKER_WINS` | Resolution favors the taker |
| `SPLIT` | Bond is split between parties |
| `RETURN` | Bond is returned to maker |
