// Day 4 - FilterBar : category pills + search + price + stock -> calls Day 3 query strings
import { useState } from 'react';
import siteConfig from '../siteConfig';

export default function FilterBar({ filters, onChange }) {
  const [term, setTerm] = useState(filters.search);
  const cats = ['', ...siteConfig.categories];

  return (
    <div className="filterbar">
      {cats.map(c => (
        <button
          key={c || 'all'}
          className={`pill ${filters.category === c ? 'active' : ''}`}
          onClick={() => onChange({ ...filters, category: c })}
        >
          {c === '' ? 'All' : c}
        </button>
      ))}

      <form
        style={{ display: 'flex', gap: 6 }}
        onSubmit={(e) => { e.preventDefault(); onChange({ ...filters, search: term }); }}
      >
        <input
          type="text"
          placeholder="Search products…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <button className="go-btn" type="submit">Search</button>
      </form>

      <select
        value={filters.maxPrice}
        onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
      >
        <option value="">Any price</option>
        <option value="25">Under $25</option>
        <option value="50">Under $50</option>
        <option value="100">Under $100</option>
      </select>

      <label style={{ fontSize: 13 }}>
        <input
          type="checkbox"
          checked={filters.inStockOnly}
          onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
        />{' '}
        In stock only
      </label>
    </div>
  );
}