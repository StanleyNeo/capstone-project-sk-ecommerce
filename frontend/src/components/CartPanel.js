// Day 4 - CartPanel : slide-in drawer. Checkout is a placeholder until Day 5.
import siteConfig from '../siteConfig';

export default function CartPanel({ cart, total, onSetQty, onClose }) {
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

        <button className="checkout-btn" disabled={cart.length === 0}
                title="Wired to POST /api/orders on Day 5">
          Checkout (arrives Day 5)
        </button>
      </aside>
    </>
  );
}
