# Url-shortener

## A URL shortener is a service that takes a long URL and returns a shorter, unique alias that redirects to the original URL.

### Functional Requirements

- **Create short link** — Accept a long URL and return a short, unique alias (e.g. `https://short.example/abc123`).
- **Redirect** — Resolve a short alias to the original URL and redirect the client (HTTP 301/302).
- **Uniqueness** — Ensure each short code is unique and stable (same long URL can map to one or configurable short link).
- **Validation** — Validate input URLs (format, length) and reject invalid or disallowed targets.
- **Optional: custom slugs** — Allow users to choose a custom short path when available.
- **Optional: expiry** — Support optional expiration or one-time-use links.
- **Optional: analytics** — Record or expose basic click/redirect counts per short link.

### Non-Functional Requirements

- **High availability** — The service should be up 99.9% of the time.
- **Low latency** — URL shortening and redirects should happen in milliseconds.
- **Scalability** — The system should handle millions of requests per day.
- **Durability** — Shortened URLs should work for years.
- **Security** — Prevent malicious use, such as phishing.

### 2. Capacity Estimation

Assumed traffic characteristics:

- **Daily URL shortening requests**: 1,000,000 requests/day
- **Read:Write ratio**: 100:1 (for every URL creation, we expect 100 redirects)
- **Peak traffic**: 10× the average load
- **Average original URL length**: 100 characters

#### 2.1 Throughput Requirements

- **Average writes per second (WPS)**:  
  \( \frac{1{,}000{,}000 \text{ requests}}{86{,}400 \text{ seconds}} \approx 12 \, \text{WPS} \)
- **Peak WPS**:  
  \( 12 \times 10 = 120 \, \text{WPS} \)
- **Average redirects per second (RPS)** (given 100:1 read:write):  
  \( 12 \times 100 = 1{,}200 \, \text{RPS} \)
- **Peak RPS**:  
  \( 120 \times 100 = 12{,}000 \, \text{RPS} \)

#### 2.2 Storage Estimation

For each shortened URL, we store:

- **Short URL**: 7 characters (Base62 encoded)
- **Original URL**: 100 characters (average)
- **Creation date**: 8 bytes (timestamp)
- **Expiration date**: 8 bytes (timestamp)
- **Click count**: 4 bytes (integer)

**Total storage per URL**:  
\( 7 + 100 + 8 + 8 + 4 = 127 \text{ bytes} \)

**Storage requirements for one year**:

- **Total URLs per year**:  
  \( 1{,}000{,}000 \times 365 = 365{,}000{,}000 \)
- **Total storage per year**:  
  \( 365{,}000{,}000 \times 127 \approx 46.4 \text{ GB} \)

#### 2.3 Bandwidth Estimation

Assume an HTTP 301 redirect response size of about 500 bytes (headers + short URL).

- **Total read bandwidth per day**:  
  \( 100{,}000{,}000 \times 500 \text{ bytes} = 50 \text{ GB/day} \)
- **Peak bandwidth** (10× average):  
  \( 500 \text{ bytes} \times 12{,}000 \text{ RPS} \approx 6 \text{ MB/s} \)

#### 2.4 Caching Estimation

This is a read-heavy system, so caching can significantly reduce latency and database load.

- Use an **80/20 rule** where 20% of URLs generate 80% of the read traffic.
- With 1,000,000 new URLs per day, caching 20% of the "hot" URLs gives:  
  \( 1{,}000{,}000 \times 0.2 \times 127 \text{ bytes} \approx 25.4 \text{ MB} \) of cache.
- Assuming a **cache hit ratio of 90%**, only **10%** of redirect requests hit the database.
- **Requests hitting the DB**:  
  \( 1{,}200 \times 0.10 \approx 120 \, \text{RPS} \)

This level of load is well within the capability of most distributed databases (e.g., DynamoDB, Cassandra) with appropriate sharding and partitioning.

#### 2.5 Infrastructure Sizing

To handle the above estimates:

- **API servers**: 4–6 instances behind a load balancer, each capable of handling roughly 200–300 RPS.
- **Database**: A distributed database cluster with ~10–20 nodes to handle storage and read/write throughput.
- **Cache layer**: A distributed cache (e.g., Redis cluster) with ~3–4 nodes, sized according to load and desired cache hit ratio.
