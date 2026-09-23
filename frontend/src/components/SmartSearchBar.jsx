// Day 6 - SmartSearchBar : natural-language search ("cheap gifts for runners")
import { useState } from 'react';

export default function SmartSearchBar({ onSearch }) {
  const [q, setQ] = useState('');
  return (
    <form className="smart-bar" onSubmit={(e) => { e.preventDefault(); if (q.trim()) onSearch(q.trim()); }}>
      <span>✨</span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder='Smart search — try "cheap gifts for runners"'
      />
      <button type="submit">Smart search</button>
    </form>
  );
}