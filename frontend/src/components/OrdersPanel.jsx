// Day 5 - OrdersPanel : order history drawer (newest first, product names populated)
import siteConfig from '../siteConfig';

const fmtDate = (iso) => new Date(iso).toLocaleString();

export default function OrdersPanel({ orders, onClose }) {
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer">
        <button className="close" onClick={onClose}>✕</button>
        <h2>My orders</h2>

        {orders.length === 0 && <p className="state">No orders yet.</p>}

        {orders.map(o => (
          <div className="order-card" key={o._id}>
            <div className="order-head">
              <span className={`status-pill s-${o.status}`}>{o.status}</span>
              <span className="order-date">{fmtDate(o.createdAt)}</span>
            </div>
            {o.items.map((it, i) => (
              <div className="line" key={i}>
                <span>{it.productId?.name || '(product)'} × {it.qty}</span>
                <span>{siteConfig.currencySymbol}{(it.price * it.qty).toFixed(2)}</span>
              </div>
            ))}
            <div className="total-row">
              <span>Total</span>
              <span>{siteConfig.currencySymbol}{o.total.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </aside>
    </>
  );
}