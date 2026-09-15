# Scope — E-Commerce Capstone (LOCKED Day 1)

## Data (MongoDB — models in backend/src/models/, seed in data/)
- products: name, price, category, description, image, stock, tags[]
- users:    name, email, password (plain text OK — prototype)
- orders:   userId, items[{productId, qty, price}], total, status, createdAt
- Seed: 12–20 products across 3–4 categories (e.g. electronics, fitness, home, books)

## Pages (React, frontend/)
1. Home `/` — navbar, 2 Flexbox feature boxes, Bootstrap product grid
2. Product `/product/:id` — details toggle, Add to Cart, "You may also like"
3. Cart `/cart` — quantities, live total
4. Checkout `/checkout` — validated form → POST /api/orders → success page

## API (Express, backend/)
- GET  /api/products?category=&search=
- GET  /api/products/:id
- POST /api/products            (admin add)
- POST /api/orders              (calc total, check stock, save)
- GET  /api/orders/:userId
- Errors: 400 missing fields · 404 unknown product · 409 out of stock

## AI (Day 6)
- Smart Search (natural-language product queries)
- AI shopping chatbot (LLM + rule-based fallback)
- Content-based recommendations (same category / shared tags)

## OUT OF SCOPE (write "no" here on purpose)
- Real payments, JWT auth, admin dashboard, image uploads, pagination, tests, Docker
- Deployment — deferred to Phase 2 (Synology NAS) after all 7 days work locally