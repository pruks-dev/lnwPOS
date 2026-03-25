# OpenPleb API Workflow

This document explains the complete API workflow for the OpenPleb P2P Bitcoin/Fiat exchange platform.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Bond System](#bond-system)
3. [Offer & Claim Flow](#offer--claim-flow)
4. [Trade Completion](#trade-completion)
5. [Dispute Handling](#dispute-handling)
6. [Real-time Updates](#real-time-updates)
7. [Admin Operations](#admin-operations)

---

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Maker    │────▶│   Server    │◀────│    Taker    │
│  (Seller)   │     │             │     │   (Buyer)   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │ POST /offers      │                   │
      │──────────────────▶│                   │
      │                   │     WebSocket     │
      │◀──────────────────│◀─────────────────▶│
      │     new-offer     │    pong (earn)    │
      │                   │                   │
      │                   │ POST /offers/:id/claim
      │                   │◀──────────────────│
      │                   │                   │
      │                   │ POST /offers/:id/receipt
      │                   │◀──────────────────│
      │                   │                   │
      │ POST /offers/:id/feedback             │
      │──────────────────▶│                   │
      │                   │                   │
      │◀──────────────────│──────────────────▶│
      │      refund       │      reward       │
      │   (Cashu token)   │   (Cashu token)   │
```

---

## Roles

- **Maker** = Seller (has Bitcoin, wants fiat)
- **Taker** = Buyer (has fiat, wants Bitcoin)

---

## Bond System

OpenPleb uses a **double-sided Bitcoin collateral** system to ensure both parties fulfill their obligations:

| Party | Role | Bond Method | Purpose |
|-------|------|-------------|---------|
| Maker | Seller | Lightning invoice OR Cashu token | Locks Bitcoin to prove they have Bitcoin to sell |
| Taker | Buyer | Cashu token | Security deposit to guarantee fiat payment |

### Maker's Bitcoin: Two Options

The maker (seller) must prove they have Bitcoin to sell. They can choose either:

| Option | API | Description |
|--------|-----|-------------|
| A | `/createinvoice` + pay externally | Pay Lightning invoice |
| B | `/paywithtoken` | Send Cashu ecash directly |

Both achieve the same: the offer becomes available for takers to claim.

### How it works:

1. **Maker** creates offer → provides Bitcoin (Lightning OR Cashu)
2. **Taker** claims offer → provides Cashu token as bond
3. **Taker** pays fiat to maker (outside the platform), sends receipt
4. **Trade completes** → both receive their Bitcoin bonds back
5. **If taker doesn't pay fiat** → maker keeps taker's Cashu bond
6. **If maker doesn't deliver Bitcoin** → taker keeps maker's Lightning/Cashu bond

This system ensures:
- Maker won't create fake offers (they lock Bitcoin)
- Taker won't claim and not pay fiat (they risk losing their Cashu bond)

---

## Offer & Claim Flow

### Step 1: Get Fiat Providers (Optional)

```bash
GET /api/v1/fiat-providers

# Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "label": "Revolut",
      "icon": "revolut",
      "matchTemplate": "...",
      "createdAt": 1700000000
    }
  ]
}
```

### Step 2: Maker Creates Offer

The maker (seller) creates an offer to receive Bitcoin by paying via fiat.

```bash
POST /api/v1/offers
{
  "qrCode": "banking QR code data",
  "amount": 100,           # Fiat amount (e.g., 100 USD)
  "fiatProviderId": 1,    # Optional - bank/payment method
  "pubkey": "npub_maker...",
  "token": "optional Cashu token for funding"
}

# Response
{
  "offer": {
    "id": 12345,
    "createdAt": 1700000000,
    "amount": 10000,        # Fiat amount in cents
    "qrCode": "...",
    "conversionRate": 45000000,
    "satsAmount": 234,     # Sats buyer will receive
    "status": "CREATED",
    "pubkey": "npub_maker...",
    "invoice": "lnbc...",   # Lightning invoice for bond
    "validForS": 120,      # Offer valid for 120 seconds
    "currency": "USD",
    "fiatProviderId": 1,
    "bondFlatRate": 100,
    "bondPercentage": 5
  }
}
```

### Step 3: Maker Provides Bitcoin (Choose Option A or B)

The maker (seller) must prove they have Bitcoin to sell. Choose one:

---

**Option A: Lightning Invoice**

### Step 3A: Create Invoice

```bash
POST /api/v1/offers/:offerId/createinvoice

# Response
{
  "success": true,
  "data": {
    "offer": {
      "id": 12345,
      "status": "INVOICE_CREATED",
      "invoice": "lnbc...",      # Lightning invoice to pay
      "validForS": 120           # Invoice valid for 120 seconds
    }
  }
}
```

### Step 4A: Maker Pays the Lightning Invoice

The maker pays the Lightning invoice externally (via their wallet).

```bash
GET /api/v1/offers/:offerId/checkinvoice

# Response - before payment
{
  "success": true,
  "data": {
    "state": "PENDING"
  }
}

# Response - after payment
{
  "success": true,
  "data": {
    "state": "PAID",
    "offer": {
      "id": 12345,
      "status": "INVOICE_PAID"
    }
  }
}
```

---

**Option B: Cashu Token (Alternative)**

### Step 3B: Maker Pays with Cashu Token

Instead of Lightning, the maker can send Cashu ecash directly.

```bash
POST /api/v1/offers/:offerId/paywithtoken
{
  "token": "CashuToken..."  # Cashu ecash token
}

# Response
{
  "success": true,
  "data": {
    "offer": {
      "id": 12345,
      "status": "INVOICE_PAID"
    }
  }
}
```

**Token amount must equal:** `satsAmount + platformFee + takerFee + bond`

---

### Step 4: Taker Discovers Offers

**Option A: WebSocket (Real-time)**

```bash
# Connect to WebSocket
WS /api/v1/ws

# Send pong to register as taker
{
  "command": "pong",
  "data": {
    "pubkey": "npub_taker...",
    "mode": "earn"  # "earn" = I want to earn Bitcoin (be taker)
  }
}

# Receive new offers in real-time
{
  "command": "new-offer",
  "data": {
    "offer": { ... }
  }
}
```

**Option B: Poll via REST Endpoint**

```bash
# Get available offers (INVOICE_PAID status - ready to be claimed)
GET /api/v1/offers

# Response
{
  "offers": [
    {
      "id": 12345,
      "createdAt": 1700000000,
      "amount": 10000,           # Fiat amount in cents
      "qrCode": "...",
      "satsAmount": 234,         # Sats buyer will receive
      "status": "INVOICE_PAID", # Ready for claiming
      "pubkey": "npub_maker...",
      "currency": "USD",
      "fiatProviderId": 1,
      "bondFlatRate": 100,
      "bondPercentage": 5,
      "bond": 105,              # Total bond in sats (taker must provide this)
      "mintUrl": "https://mint...",  # Cashu mint URL for taker to get tokens
      "validForS": 259200       # Offer valid for 3 days
    }
  ]
}

# Get offers by pubkey (not for claiming - for user's own offers)
GET /api/v1/data/:pubkey

# Get offer by ID
GET /api/v1/data/for/:id
```

### Step 5: Taker Claims Offer

The taker (buyer) claims the offer by providing a Cashu token as a **security deposit (bond)**.

- If taker pays fiat → gets their Cashu bond back + receives Bitcoin
- If taker doesn't pay fiat → maker keeps the Cashu bond

**Taker must:**
1. Get the bond amount from the offer (`bond` field)
2. Get the mint URL from the offer (`mintUrl` field)
3. Use a Cashu wallet to mint tokens from that mint
4. Submit the token when claiming

```bash
POST /api/v1/offers/:offerId/claim
{
  "pubkey": "npub_taker...",
  "bond": "CashuToken..."  # Cashu ecash token as security deposit
}

# Response
{
  "claim": {
    "id": 1,
    "offerId": 12345,
    "pubkey": "npub_taker...",
    "createdAt": 1700000000
  },
  "offer": {
    "id": 12345,
    "status": "CLAIMED",
    ...
  }
}
```

---

## Trade Completion

### Step 6: Taker Submits Receipt

After making the fiat payment, the taker submits proof of payment.

```bash
POST /api/v1/offers/:offerId/receipt
{
  "receipt": "receipt_data_or_image_base64",
  "pubkey": "npub_taker..."
}

# Response
{
  "success": true,
  "data": { ... }
}
```

### Step 7: Trade Completes (Maker Submits Feedback)

After taker submits receipt, the **maker must submit feedback** to complete the trade. This triggers the Bitcoin transfer:

- **Taker receives:** `satsAmount + taker's bond` (as Cashu token)
- **Maker receives:** `maker's bond` (minus fees)
- **Platform takes:** fees

```bash
POST /api/v1/offers/:offerId/feedback
{
  "payload": {
    "status": "positive",
    "feedback": "Great trade!"
  },
  "nonce": "random_string",
  "timestamp": 1700000000,
  "signature": "..."
}

# Response - This is how Taker gets their Bitcoin!
{
  "status": "COMPLETED",
  "reward": "CashuToken...",  # Taker receives Bitcoin here
  "refund": "CashuToken..."   # Maker gets bond back
}
```

---

## Offer States

```
CREATED ──────▶ INVOICE_CREATED ──────▶ INVOICE_PAID ──────▶ CLAIMED
   │                                       │                    │
   │          (expired after 120s)         │                    │
   ▼                                       ▼                    ▼
EXPIRED             ◀──────         RECEIPT_SUBMITTED ◀─────────┘
                                           │
                                           ▼
                                    PAID_WITH_TOKEN
                                           │
                                           ▼
                                       COMPLETED
```

| State | Description |
|-------|-------------|
| `CREATED` | Offer created, waiting for invoice |
| `INVOICE_CREATED` | Bond invoice generated for maker |
| `INVOICE_PAID` | Maker has paid the bond invoice |
| `CLAIMED` | Taker has bonded |
| `RECEIPT_SUBMITTED` | Taker sent proof of fiat payment |
| `PAID_WITH_TOKEN` | Taker paid with Cashu |
| `COMPLETED` | Trade finished successfully |
| `EXPIRED` | Offer expired |
| `DISPUTED` | Under dispute |
| `RESOLVED` | Dispute resolved |
| `ERROR` | Error occurred |

---

## Dispute Handling

### If Something Goes Wrong

```bash
# Taker responds to dispute
POST /api/v1/offers/:offerId/counterorforfeit
{
  "payload": {
    "response": "FORFEIT" | "COUNTER",
    "message": "optional message"
  },
  "nonce": "...",
  "timestamp": 1700000000,
  "signature": "..."
}
```

### Admin Resolves Dispute

```bash
POST /api/v1/admin/resolvedispute

{
  "offerId": 12345,
  "winner": "maker" | "taker",
  "forfeitTo": "maker" | "taker"
}
```

---

## Real-time Updates

### WebSocket Connection

```bash
# Connect without auth
WS /api/v1/ws
```

### Server → Client Messages

**Ping (every 5 seconds):**
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
    "offer": { ... }
  }
}
```

### Client → Server Messages

**Pong (register mode):**
```json
{
  "command": "pong",
  "data": {
    "pubkey": "npub...",
    "mode": "pay" | "earn"
  }
}
```

| Mode | Description |
|------|-------------|
| `pay` | I want to sell Bitcoin (maker) |
| `earn` | I want to buy Bitcoin (taker) |

---

## Admin Operations

### Fiat Providers

```bash
# Create fiat provider
POST /api/v1/admin/fiat-providers
{
  "label": "Revolut",
  "icon": "revolut",
  "matchTemplate": "optional-template"
}

# Update fiat provider
PUT /api/v1/admin/fiat-providers/:id
{
  "label": "PayPal"
}

# Delete fiat provider
DELETE /api/v1/admin/fiat-providers/:id
```

### Get Admin Data

```bash
# Get recent offers
GET /api/v1/admin/data

# Response
{
  "offers": [...],
  "env": { ... }
}
```

---

## Environment Settings

```bash
GET /api/v1/envsettings

# Response
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

## Complete Flow Example

**Option A: Maker uses Lightning**

```bash
# 1. Maker (Seller) creates offer
POST /api/v1/offers
{
  "qrCode": "bank:123456789",
  "amount": 50,
  "pubkey": "npub_maker..."
}
# → Returns offer with id=1, status=CREATED

# 2. Maker creates Lightning invoice
POST /api/v1/offers/1/createinvoice
# → Returns Lightning invoice, status=INVOICE_CREATED

# 3. Maker pays the Lightning invoice (external wallet)
# ...

# 4. Maker checks if invoice is paid
GET /api/v1/offers/1/checkinvoice
# → {"state": "PAID", "status": "INVOICE_PAID"}

# 5. Taker (Buyer) discovers offers
GET /api/v1/offers

# 6. Taker claims the offer (provides Cashu bond)
POST /api/v1/offers/1/claim
{"pubkey": "npub_taker...", "bond": "CashuToken..."}

# 7. Taker pays fiat to maker, submits receipt
POST /api/v1/offers/1/receipt
{"receipt": "base64_image...", "pubkey": "npub_taker..."}

# 8. Maker submits feedback to complete trade & send Bitcoin to taker
POST /api/v1/offers/1/feedback
{
  "payload": { "status": "positive", "feedback": "Trade completed" },
  "nonce": "...",
  "timestamp": 1700000000,
  "signature": "..."
}
# → Taker receives Cashu token (their Bitcoin + bond back)
# → Maker receives Cashu token (their bond back minus fees)
```

**Option B: Maker uses Cashu token**

```bash
# 1. Maker (Seller) creates offer
POST /api/v1/offers
{
  "qrCode": "bank:123456789",
  "amount": 50,
  "pubkey": "npub_maker..."
}
# → Returns offer with id=1, status=CREATED

# 2. Maker pays with Cashu token directly
POST /api/v1/offers/1/paywithtoken
{"token": "CashuToken..."}
# → status: INVOICE_PAID

# 3. Taker (Buyer) discovers offers
GET /api/v1/offers

# 4. Taker claims the offer (provides Cashu bond)
POST /api/v1/offers/1/claim
{"pubkey": "npub_taker...", "bond": "CashuToken..."}

# 5. Taker pays fiat to maker, submits receipt
POST /api/v1/offers/1/receipt
{"receipt": "base64_image...", "pubkey": "npub_taker..."}

# 6. Maker submits feedback to complete trade & send Bitcoin to taker
POST /api/v1/offers/1/feedback
{
  "payload": { "status": "positive", "feedback": "Trade completed" },
  "nonce": "...",
  "timestamp": 1700000000,
  "signature": "..."
}
# → Taker receives Cashu token (their Bitcoin + bond back)
# → Maker receives Cashu token (their bond back minus fees)
```

---

## Push Notifications (Optional)

```bash
# Get VAPID key
GET /api/v1/vapid
# → {"publicKey": "..."}

# Subscribe to notifications
POST /api/v1/subscribe
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "expirationTime": null,
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

---

## Error Handling

Most endpoints return standard error responses:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

Common HTTP status codes:
- `400` - Bad request (invalid parameters)
- `404` - Not found
- `500` - Server error
