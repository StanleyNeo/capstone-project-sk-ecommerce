import { useState } from 'react';
import siteConfig from '../siteConfig';

export default function ProductCard({ product, onAdd }) {
  const out = product.stock <= 0;
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 800);   // flash "Added!" for 0.8s
  };

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
        <button className="add-btn" disabled={out} onClick={handleAdd}>
          {out ? 'Unavailable' : added ? '✓ Added!' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}