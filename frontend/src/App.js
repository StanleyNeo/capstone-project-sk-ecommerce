// Day 4 - App.js : state lives here, flows down to components
import { useCallback, useEffect, useState } from 'react';
import siteConfig from './siteConfig';
import { getProducts } from './api/client';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ProductCard from './components/ProductCard';
import CartPanel from './components/CartPanel';
import './App.css';

export default function App() {
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ category: '', search: '', maxPrice: '', inStockOnly: false });
  const [cart, setCart] = useState([]);            // [{ product, qty }]
  const [cartOpen, setCartOpen] = useState(false);

  // Brand the app from ONE config file (template rule #1)
  useEffect(() => {
    document.title = siteConfig.businessName;
    const root = document.documentElement;
    root.style.setProperty('--brand', siteConfig.colors.primary);
    root.style.setProperty('--accent', siteConfig.colors.accent);
  }, []);

  // Refetch whenever filters change — the API does the filtering, not the browser
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const body = await getProducts({
        category: filters.category,
        search: filters.search,
        maxPrice: filters.maxPrice,
        inStock: filters.inStockOnly ? 'true' : ''
      });
      setProducts(body.data);
      setCount(body.count);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  // ---- cart (local state; server stays the source of truth for price/stock) ----
  const addToCart = (product) =>
    setCart(prev => {
      const found = prev.find(l => l.product._id === product._id);
      if (found) {
        return prev.map(l => l.product._id === product._id ? { ...l, qty: l.qty + 1 } : l);
      }
      return [...prev, { product, qty: 1 }];
    });

  const setQty = (id, qty) =>
    setCart(prev =>
      qty <= 0
        ? prev.filter(l => l.product._id !== id)
        : prev.map(l => l.product._id === id ? { ...l, qty } : l)
    );

  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = cart.reduce((s, l) => s + l.qty * l.product.price, 0);

  return (
    <div>
      <Header cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />

      <section className="hero">
        <h1>{siteConfig.hero.title}</h1>
        <p>{siteConfig.hero.subtitle}</p>
      </section>

      <FilterBar filters={filters} onChange={setFilters} />

      <p className="count-line">
        {loading ? 'Loading…' : `${count} product${count === 1 ? '' : 's'}`}
      </p>

      {error && (
        <div className="state error">⚠️ {error} — is the API running on port 5000?</div>
      )}
      {!loading && !error && products.length === 0 && (
        <div className="state">No products match these filters.</div>
      )}

      <main className="grid">
        {products.map(p => <ProductCard key={p._id} product={p} onAdd={addToCart} />)}
      </main>

      {cartOpen && (
        <CartPanel cart={cart} total={cartTotal} onSetQty={setQty} onClose={() => setCartOpen(false)} />
      )}
    </div>
  );
}