// Day 4 - api/client.js : the only file that knows the API's address
const BASE = '/api';   // CRA proxy forwards this to http://localhost:5000

async function call(path) {
  const res = await fetch(path);
  const body = await res.json();
  if (!body.success) throw new Error(body.error || `Request failed: ${res.status}`);
  return body;   // { success, count, data }
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