// Day 4 - Header : business identity from siteConfig + cart button
import siteConfig from '../siteConfig';

export default function Header({ cartCount, onOpenCart }) {
  return (
    <header className="header">
      <div>
        <div className="brand">{siteConfig.businessName}</div>
        <div className="tagline">{siteConfig.tagline}</div>
      </div>
      <button className="cart-btn" onClick={onOpenCart}>
        🛒 Cart <span className="badge">{cartCount}</span>
      </button>
    </header>
  );
}