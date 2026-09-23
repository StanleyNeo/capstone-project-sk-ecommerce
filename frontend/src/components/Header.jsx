// Day 5 - Header : identity + cart + order history
import siteConfig from '../siteConfig';

export default function Header({ cartCount, onOpenCart, onOpenOrders }) {
  return (
    <header className="header">
      <div>
        <div className="brand">{siteConfig.businessName}</div>
        <div className="tagline">{siteConfig.tagline}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="cart-btn" onClick={onOpenOrders}>📦 My orders</button>
        <button className="cart-btn" onClick={onOpenCart}>
          🛒 Cart <span className="badge">{cartCount}</span>
        </button>
      </div>
    </header>
  );
}