# URL Shortener

A production-grade URL shortener with click analytics, geo-tracking, plan-based access control, and Stripe billing. Built as a Turborepo monorepo with a React SPA and an Express.js API on the Bun runtime.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / Client                        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              React 19 SPA  (Vite · shadcn/ui · TanStack Query)  │
└───────────────────────────────┬─────────────────────────────────┘
                                │  HTTPS + httpOnly cookies
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Express v5 API  (Bun runtime)                  │
│                                                                 │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐  │
│   │ Auth / JWT  │   │ Short Links │   │  Billing (Stripe)   │  │
│   │  (cookies)  │   │  + Plans    │   │  webhook processor  │  │
│   └─────────────┘   └──────┬──────┘   └─────────────────────┘  │
│                            │                                    │
│   ┌─────────────────────── │ ──────────────────────────────┐   │
│   │          Redirect hot path  (GET /r/:code)             │   │
│   │                         │                              │   │
│   │   ┌──────────────┐      │     ┌────────────────────┐   │   │
│   │   │  LRU Cache   │◄─────┴────►│  Redis Cache       │   │   │
│   │   │  (in-proc)   │  fallback  │  (primary)         │   │   │
│   │   └──────────────┘            └────────┬───────────┘   │   │
│   │                                        │ cache miss     │   │
│   │                                        ▼               │   │
│   │                              ┌──────────────────┐      │   │
│   │                              │   PostgreSQL      │      │   │
│   │                              │   (Neon)         │      │   │
│   │                              └──────────────────┘      │   │
│   │                                                        │   │
│   │   ┌─────────────────────────────────────────────────┐  │   │
│   │   │  Click event  ──RPUSH──►  Redis List            │  │   │
│   │   │  (fire & forget, ~0.3 ms)   click_events        │  │   │
│   │   └─────────────────────────────────────────────────┘  │   │
│   └────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Click Worker  (background loop, same process)          │   │
│   │  LRANGE 50 → bulk Prisma createMany → Postgres          │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Stack

| Layer | Technology |
|---|---|
| **Monorepo** | Turborepo + Bun workspaces |
| **API runtime** | Bun 1.2 + Express v5 + TypeScript |
| **Database** | PostgreSQL (Neon serverless) via Prisma v7 |
| **Cache / Queue** | Redis (Redis Cloud) + LRU in-process fallback |
| **Auth** | JWT HS256 (jose), httpOnly cookies, refresh token rotation |
| **Payments** | Stripe v21 — subscriptions, checkout sessions, webhooks |
| **Geo / UA** | `geoip-lite` + `ua-parser-js` |
| **Frontend** | React 19, React Router v7, TanStack Query v5, Zustand v5, shadcn/ui |
| **Validation** | Zod v4 |
| **Short URL gen** | SHA-256 (Bun.CryptoHasher) → base64url, 8-char collision-safe codes |

---

## Scale Considerations

### Why Redis?

**1. Redirect hot path — sub-millisecond cache**
Every `GET /r/:code` lookup hits Redis before touching Postgres. A cache hit costs ~0.2 ms vs ~5–20 ms for a DB round-trip. Under high read load (most traffic is redirects, not writes) this is the single most impactful optimization.

**2. Layered fallback — LRU in-process cache**
If Redis is unavailable, an in-process `lru-cache` absorbs the load. Redirects never hard-fail due to a cache outage. Consistency is eventual; correctness is preserved because the source of truth is always Postgres.

**3. Distributed rate limiting**
Custom Redis-backed rate limiter (`src/middleware/rateLimit.ts`) shares state across multiple API instances. An in-memory rate limiter would be per-process and trivially bypassed behind a load balancer.

**4. Durable queue**
A Redis list (`RPUSH` / `LRANGE`) acts as a lightweight, persistent queue for click events. Events survive an API process restart (they remain in Redis) and are drained by the worker on restart.

### Why a Queue for Click Tracking?

The redirect hot path must be fast. Writing a full click record to Postgres on every redirect — with geo-IP lookup, UA parsing, and a relational insert — would add 10–30 ms of synchronous latency and create a write bottleneck under load.

Instead:
1. `eventPublisher.ts` fires `RPUSH click_events <payload>` — ~0.3 ms, completely async.
2. `clickWorker.ts` runs a background polling loop: drains up to **50 events per tick** with `LRANGE`, bulk-inserts via `createMany`, then trims the list.
3. Result: the redirect returns to the client before any DB write occurs. Click throughput scales independently of redirect throughput.

This is the **producer / consumer** pattern: decouple latency-sensitive producers from throughput-sensitive consumers.

---

## Tradeoffs

### Why not Kafka or RabbitMQ?
Operational overhead is not justified at this scale. A Redis list gives durable, ordered, at-least-once delivery with zero additional infrastructure. Kafka is the right answer when you need replay, fan-out to multiple consumers, or millions of events/sec.

### Why not server-side rendering (Next.js)?
The product is a dashboard-heavy SPA where almost every page requires authentication. SSR's main benefit — faster first meaningful paint for public content — applies only to the landing page here. A Vite SPA keeps the frontend/backend boundary clean and avoids coupling the deployment lifecycle of two apps.

### Why not store JWT in localStorage?
`localStorage` is accessible to any JavaScript on the page, making it vulnerable to XSS. JWTs are stored in `httpOnly; Secure; SameSite=Strict` cookies — unreachable from JavaScript. The tradeoff is that CSRF protection must be handled, which `SameSite=Strict` covers for same-origin requests.

### Why not a managed short-link CDN (e.g., CloudFront)?
Edge redirects would be faster but eliminate server-side analytics entirely. Geo-IP, user-agent parsing, and click attribution all require a server-side hop. The current architecture keeps analytics first-class.

### Why not `pg` pool directly instead of Prisma?
Prisma provides type-safe query builders, migration management, and the generated client is used across repositories consistently. The `@prisma/adapter-pg` integration uses the native `pg` driver under the hood, so there is no meaningful performance penalty.

### Why not Node.js instead of Bun?
Bun provides a faster startup time, built-in `CryptoHasher` (used for short URL generation), and `Bun.password` for bcrypt — removing two runtime dependencies. The Dockerfile runs Bun directly in production.

---

## Metrics

> These are architecture-derived estimates. Actual numbers depend on Redis/Postgres instance size and network topology.

| Scenario | Estimated throughput |
|---|---|
| Redirect (Redis cache hit) | ~8,000–12,000 req/sec per process |
| Redirect (cache miss, DB read) | ~1,500–3,000 req/sec per process |
| Click write pipeline | ~2,500 clicks/sec sustained (batched 50 at a time) |
| Auth / link CRUD endpoints | ~500–1,000 req/sec per process |

**Bottlenecks in order:**
1. Redis connection pool / RTT (cache hit path)
2. Postgres connection pool (cache miss + write path)
3. Bun/Node single-thread CPU (UA parsing, Zod validation)

Horizontal scaling: each API instance is stateless (sessions are in cookies + DB). Adding instances requires only a shared Redis and Postgres — no sticky sessions.

---

## Project Structure

```
url-shortener/
├── apps/
│   ├── api/                    # Express.js API (Bun)
│   │   ├── prisma/             # Schema + migrations
│   │   └── src/
│   │       ├── config/         # Env vars, cookie options, plan definitions
│   │       ├── controllers/    # Request handlers
│   │       ├── database/       # Prisma client + Redis client
│   │       ├── lib/            # Short URL gen, UA parser, Stripe instance
│   │       ├── middleware/     # Auth, plan checks, rate limiting
│   │       ├── repositories/   # DB access layer (Prisma)
│   │       ├── routes/         # Express routers
│   │       ├── services/       # Business logic + cache + queue worker
│   │       ├── types/          # Shared TypeScript types + Result<T>
│   │       └── validations/    # Zod schemas
│   └── web/                    # React 19 SPA (Vite)
│       └── src/
│           ├── components/     # UI components (shadcn/ui + feature components)
│           ├── hooks/          # TanStack Query hooks
│           ├── lib/            # fetch wrapper, error handling
│           ├── pages/          # Route-level page components
│           └── store/          # Zustand auth store
└── turbo.json                  # Turborepo pipeline
```

## Plans

| Feature | Free | Premium ($9/mo) |
|---|---|---|
| Links | 10 | Unlimited |
| Link expiry | 7 days (auto) | Custom |
| Analytics | Basic | Full (geo, device, browser) |
| Region blocking | No | Yes |
| Custom expiry | No | Yes |

## API

Base: `/api/v1`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register |
| `POST` | `/auth/login` | — | Login |
| `POST` | `/auth/refresh` | cookie | Rotate refresh token |
| `POST` | `/auth/logout` | cookie | Revoke refresh token |
| `GET` | `/users/me` | required | Get profile |
| `PATCH` | `/users/me` | required | Update profile |
| `DELETE` | `/users/me` | required | Delete account |
| `POST` | `/links` | required | Create short link |
| `GET` | `/links` | required | List links |
| `GET` | `/links/:id` | required | Get link |
| `PATCH` | `/links/:id` | required | Update link |
| `DELETE` | `/links/:id` | required | Delete link |
| `GET` | `/links/:id/analytics` | required | Click analytics |
| `POST` | `/billing/create-checkout-session` | required | Start Stripe checkout |
| `GET` | `/billing/subscription-status` | required | Current plan |
| `POST` | `/billing/cancel` | required | Cancel subscription |
| `POST` | `/billing/webhook` | Stripe sig | Stripe event processor |
| `GET` | `/redirect/:shortUrl` | — | Resolve short URL |

## Getting Started

```bash
# Install dependencies
bun install

# API — copy and fill env vars
cp apps/api/.env.example apps/api/.env

# Run migrations
cd apps/api && bunx prisma migrate dev

# Start all apps
bun run dev
```

Required env vars (API): `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
