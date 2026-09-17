// Day 5 - App.js : checkout flow + order history (+ double-submit lock + error clearing)
import { useCallback, useEffect, useRef, useState } from 'react';   // ← NEW: useRef added
import siteConfig from './siteConfig';
import { getProducts, lookupUser, createOrder, getOrders } from './api/client';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ProductCard from './components/ProductCard';
import CartPanel from './components/CartPanel';
import OrdersPanel from './components/OrdersPanel';
import './App.css';

export default function App() {
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ category: '', search: '', maxPrice: '', inStockOnly: false });
  const [cart, setCart] = useState([]);            // [{ product, qty }]
  const [cartOpen, setCartOpen] = useState(false);

  // Day 5: identity (auth stand-in), checkout result, order history
  const [demoUser, setDemoUser] = useState(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const checkoutLock = useRef(false);              // ← NEW: hard double-submit guard

  // Brand the app from ONE config file (template rule #1)
  useEffect(() => {
    document.title = siteConfig.businessName;
    const root = document.documentElement;
    root.style.setProperty('--brand', siteConfig.colors.primary);
    root.style.setProperty('--accent', siteConfig.colors.accent);
  }, []);

  // Who am I? Until real auth exists, the seeded demo account stands in.
  useEffect(() => {
    lookupUser(siteConfig.demoUserEmail)
      .then(body => setDemoUser(body.data))
      .catch(e => setError(e.message));
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
  const addToCart = (product) => {
    setCheckoutError('');                          // ← NEW: cart changed, old error is stale
    setCart(prev => {
      const found = prev.find(l => l.product._id === product._id);
      if (found) {
        return prev.map(l => l.product._id === product._id ? { ...l, qty: l.qty + 1 } : l);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const setQty = (id, qty) => {
    setCheckoutError('');                          // ← NEW: cart changed, old error is stale
    setCart(prev =>
      qty <= 0
        ? prev.filter(l => l.product._id !== id)
        : prev.map(l => l.product._id === id ? { ...l, qty } : l)
    );
  };

  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = cart.reduce((s, l) => s + l.qty * l.product.price, 0);

  // ---- Day 5: checkout ----
  const handleCheckout = async () => {
    if (!demoUser || cart.length === 0 || checkoutLock.current) return;   // ← NEW: lock check
    checkoutLock.current = true;                                          // ← NEW: lock ON (instant)
    setCheckoutBusy(true);
    setCheckoutError('');
    try {
      const body = await createOrder(
        demoUser._id,
        cart.map(l => ({ productId: l.product._id, qty: l.qty }))
      );
      setOrderPlaced(body.data);   // success banner
      setCart([]);                 // empty the cart
      setCartOpen(false);
      load();                      // re-fetch: stock numbers changed on the server
    } catch (e) {
      setCheckoutError(e.message); // server's exact words (e.g. the 409 stock message)
    } finally {
      checkoutLock.current = false;                                       // ← NEW: lock OFF
      setCheckoutBusy(false);
    }
  };

  const openOrders = async () => {
    if (!demoUser) return;
    try {
      const body = await getOrders(demoUser._id);
      setOrders(body.data);
      setOrdersOpen(true);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <Header cartCount={cartCount} onOpenCart={() => setCartOpen(true)} onOpenOrders={openOrders} />

      <section className="hero">
        <h1>{siteConfig.hero.title}</h1>
        <p>{siteConfig.hero.subtitle}</p>
      </section>

      {orderPlaced && (
        <div className="success-bar">
          <span>
            ✅ Order placed! Total {siteConfig.currencySymbol}{orderPlaced.total.toFixed(2)}
            {' '}· status <b>{orderPlaced.status}</b> · id {orderPlaced._id}
          </span>
          <button onClick={() => setOrderPlaced(null)}>Dismiss</button>
        </div>
      )}

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
        <CartPanel
          cart={cart}
          total={cartTotal}
          onSetQty={setQty}
          onClose={() => { setCartOpen(false); setCheckoutError(''); }}
          onCheckout={handleCheckout}
          busy={checkoutBusy}
          error={checkoutError}
        />
      )}

      {ordersOpen && <OrdersPanel orders={orders} onClose={() => setOrdersOpen(false)} />}
    </div>
  );
}