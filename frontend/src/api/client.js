// Phase 3: dev = '/api' (CRA proxy to :5000); prod = 'https://<render>.onrender.com/api' (set in Vercel)
// const BASE = (process.env.REACT_APP_API_URL || '') + '/api';

const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

async function parse(res) {
  const body = await res.json();
  if (!body.success) {
    const err = new Error(body.error || `Request failed: ${res.status}`);
    err.status = res.status;          // 400 / 404 / 409 available if a component wants it
    throw err;
  }
  return body;   // { success, count, data }
}

async function call(path) {
  return parse(await fetch(path));
}

async function post(path, payload) {
  return parse(await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }));
}

export function getProducts({ category, search, maxPrice, inStock } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (search)   params.set('search', search);
  if (maxPrice) params.set('maxPrice', maxPrice);
  if (inStock)  params.set('inStock', inStock);
  const qs = params.toString();
  return call(`${BASE}/products${qs ? `?${qs}` : ''}`);
}

export function getProduct(id) {
  return call(`${BASE}/products/${id}`);
}

// ---- Day 5 ----
export function lookupUser(email) {
  return call(`${BASE}/users/lookup?email=${encodeURIComponent(email)}`);
}

export function createOrder(userId, items) {
  return post(`${BASE}/orders`, { userId, items });
}

export function getOrders(userId) {
  return call(`${BASE}/orders/${userId}`);
}

// ---- Day 6 ----
export function chat(message) {
  return post(`${BASE}/chatbot/chat`, { message });
}

export function smartSearch(query) {
  return post(`${BASE}/search/smart`, { query });
}

export function aiStats() {
  return call(`${BASE}/ai/stats`);
}