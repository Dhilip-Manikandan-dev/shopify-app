# Smart Offer Rules — Production Architecture

A high-performance, enterprise-grade Shopify Public App built on **Next.js Pages Router**, **TypeScript**, **Shopify Polaris**, **Prisma ORM**, and **PostgreSQL**.

Smart Offer Rules provides a **single, unified conditional rule engine** that simultaneously triggers dynamic **Free Shipping Bars**, **Order-Level Discounts**, and **1-Click Upsells** across Product, Collection, and Cart surfaces.

---

## 🛠 Tech Stack

- **Framework**: Next.js (Pages Router strictly — `pages/` thin routes, `features/` domain logic)
- **Language**: TypeScript (strict mode, zero errors)
- **Frontend / Merchant UI**: React 18.3.1, Shopify Polaris v13, App Bridge, Tailwind CSS
- **Database & ORM**: PostgreSQL with Prisma ORM 5.22
- **Token Security**: AES-256-GCM authenticated encryption at rest (Random 12-byte IV + 16-byte Auth Tag)
- **Storefront SDK & Extensions**:
  - Theme App Extension: 4 Liquid Blocks (`smart_product_upsell`, `smart_collection_offer`, `smart_cart_upsell`, `free_shipping_progress`)
  - Unified SDK: `smart-offer-rules.js` (Cart interception, debounce, deduplication, impression/click analytics)
  - Shopify Function: Checkout order discount target (`purchase.order-discount.run`)
- **Testing**: Vitest test runner (evaluator, auth crypto, multi-tenancy, rate limiter)

---

## 🏛 Architecture & Project Layout

```
shopify-app/
├── pages/
│   ├── _app.tsx                      # Polaris AppProvider & layout
│   ├── _document.tsx                 # DM Sans & font preconnect
│   ├── index.tsx                     # Redirect to /app
│   ├── app/                          # Merchant embedded UI (thin route wrappers)
│   │   ├── index.tsx                 # Home dashboard
│   │   ├── rules/
│   │   │   ├── index.tsx             # Rule listing & filters
│   │   │   ├── new.tsx               # Create rule (RuleBuilder)
│   │   │   └── [ruleId]/
│   │   │       ├── index.tsx         # Edit rule
│   │   │       └── test.tsx          # Rule simulator / tester
│   │   ├── analytics.tsx             # Conversion funnel & impressions
│   │   ├── settings.tsx              # Localization & domestic country
│   │   └── billing.tsx               # Plan pricing & recurring charge
│   └── api/                          # Next.js Pages Router backend API
│       ├── auth/                     # Shopify OAuth start & callback
│       ├── rules/                    # Rule CRUD & simulation endpoints
│       ├── storefront/               # Public rate-limited offers endpoint
│       ├── analytics/                # Event ingestion & metrics aggregation
│       ├── shopify/                  # Admin GraphQL product picker search
│       ├── settings/                 # Store localization & settings
│       ├── billing/                  # Subscription creation & status
│       └── webhooks/                 # HMAC-verified raw webhook handler
├── features/                         # Feature-based domain modules
│   ├── home/                         # KPI cards, setup checklist
│   ├── rules/                        # RuleBuilder, ConditionGroup, ActionList, Tester
│   ├── analytics/                    # Funnel charts, performance tables
│   ├── settings/                     # Localization & surface toggles
│   ├── billing/                      # Plan comparison cards
│   └── products/                     # Admin GraphQL product picker modal
├── components/                       # Shared UI and layouts
│   ├── common/                       # LoadingState, EmptyState, ErrorState, ConfirmDialog
│   └── layout/                       # AppLayout, PageHeader
├── lib/
│   ├── prisma.ts                     # Prisma client singleton
│   ├── encryption/tokenCrypto.ts     # AES-256-GCM token crypto
│   ├── auth/sessionToken.ts          # App Bridge session token validation
│   ├── rule-engine/                  # Deterministic Condition & Action Evaluator
│   └── shopify/client.ts             # Admin GraphQL client
├── server/
│   ├── auth/withAuth.ts              # API authentication middleware
│   ├── repositories/                 # StoreRepository, RuleRepository, CredentialRepository
│   ├── services/                     # RuleService, StorefrontService, AnalyticsService
│   └── security/                     # Rate limiting & timing-safe HMAC validation
├── extensions/
│   ├── theme-app-extension/          # Theme App Extension Liquid blocks & unified SDK
│   └── discount-function/            # Checkout discount Shopify Function
└── tests/                            # Comprehensive Vitest test suites
```

---

## 🔐 Token Security & Offline Token Lifecycle

Shopify expiring offline access tokens and refresh tokens are protected using **AES-256-GCM authenticated encryption**:
- Never hashed with SHA/bcrypt (which are irreversible).
- Proactive token refresh: tokens expiring within 5 minutes are refreshed automatically before API calls.
- Concurrent lock protection: database lock lease (`refreshLockUntil`) prevents race conditions when concurrent requests trigger token rotation.
- Re-authentication detection: if a refresh token is revoked, `reauthRequired = true` is flagged and a clean `SHOPIFY_AUTH_REQUIRED` status is returned.

---

## ⚡ Setup & Development

### 1. Environment Configuration
Copy `.env.example` to `.env` and fill in your Shopify App credentials:
```bash
cp .env.example .env
```
Generate a 32-byte hex encryption key for `SHOPIFY_TOKEN_ENCRYPTION_KEY`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Database Migration
Ensure PostgreSQL is running, then run Prisma migrations:
```bash
npx prisma db push
# or
npx prisma migrate dev --name init
```

### 3. Running Locally
```bash
# Start Next.js development server
npm run dev

# Run TypeScript typecheck (0 errors)
npm run typecheck

# Run test suites
npm run test

# Validate production build
npm run build
```

---

## 🧪 Storefront Testing & Theme App Extension

1. Deploy or link the theme app extension using Shopify CLI:
   ```bash
   shopify app dev
   ```
2. In the Shopify Online Store Theme Editor:
   - Add the **Smart Product Upsell** block to the Product page template.
   - Add the **Free Shipping Progress** block to your Header or Cart drawer.
   - Add the **Smart Cart Upsell** block to the Cart template.
3. Use the integrated **Interactive Rule Simulation** inside the Merchant Admin under **Rules > Test** or within the **Rule Builder** to test condition evaluations without altering live customer carts.
# Smart-discount
