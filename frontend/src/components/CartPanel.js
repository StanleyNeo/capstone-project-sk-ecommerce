// Day 5 - CartPanel : checkout posts to the API; server errors show verbatim
import siteConfig from '../siteConfig';

export default function CartPanel({ cart, total, onSetQty, onClose, onCheckout, busy, error }) {
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer">
        <button className="close" onClick={onClose}>✕</button>
        <h2>Your cart</h2>

        {cart.length === 0 && <p className="state">Cart is empty — add something!</p>}

        {cart.map(({ product, qty }) => (
          <div className="line" key={product._id}>
            <span>{product.name}</span>
            <span className="qty">
              <button onClick={() => onSetQty(product._id, qty - 1)}>−</button>
              {' '}{qty}{' '}
              <button onClick={() => onSetQty(product._id, qty + 1)}>+</button>
            </span>
            <span>{siteConfig.currencySymbol}{(product.price * qty).toFixed(2)}</span>
          </div>
        ))}

        <div className="total-row">
          <span>Total</span>
          <span>{siteConfig.currencySymbol}{total.toFixed(2)}</span>
        </div>

        {error && <div className="error-box">⚠️ {error}</div>}

        <button className="checkout-btn" disabled={cart.length === 0 || busy} onClick={onCheckout}>
          {busy ? 'Placing order…' : 'Checkout'}
        </button>
        <p className="fine-print">The server re-checks price &amp; stock — the API is the gatekeeper.</p>
      </aside>
    </>
  );
}