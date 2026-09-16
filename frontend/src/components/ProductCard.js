// Day 4 - ProductCard : one product. Out-of-stock = disabled button (matches API's 409)
import siteConfig from '../siteConfig';

export default function ProductCard({ product, onAdd }) {
  const out = product.stock <= 0;
  return (
    <div className="card">
      <img src={product.image} alt={product.name} loading="lazy" />
      <div className="body">
        <span className="cat">{product.category}</span>
        <span className="name">{product.name}</span>
        <span className={`stock ${out ? 'out' : ''}`}>
          {out ? 'Out of stock' : `${product.stock} in stock`}
        </span>
        <span className="price">
          {siteConfig.currencySymbol}{product.price.toFixed(2)}
        </span>
        <button className="add-btn" disabled={out} onClick={() => onAdd(product)}>
          {out ? 'Unavailable' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}
