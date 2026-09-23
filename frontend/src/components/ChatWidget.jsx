// Day 6 - ChatWidget : floating shop assistant. Provider badge shows WHO answered.
import { useState } from 'react';
import { chat } from '../api/client';
import siteConfig from '../siteConfig';

export default function ChatWidget({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: `Hi! I'm the ${siteConfig.businessName} assistant. Ask me about products, gifts, or your orders.`, products: [], provider: null }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [addedId, setAddedId] = useState(null);   // which chip just flashed "✓ Added!"

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setBusy(true);
    try {
      const body = await chat(text);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: body.data.reply,
        products: body.data.products || [],
        provider: body.data.provider
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: `⚠️ ${err.message}`, products: [], provider: null }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(!open)}>💬</button>
      {open && (
        <div className="chat-panel">
          <div className="chat-head">
            Shop assistant
            <button className="close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <div>{m.text}</div>
                {m.provider && <div className="provider-tag">via {m.provider}</div>}
                {m.products && m.products.length > 0 && (
                  <div className="chat-products">
                    {m.products.map(p => (
                      <div className="chat-product" key={p._id}>
                        <span>{p.name} · {siteConfig.currencySymbol}{p.price.toFixed(2)}</span>
                        <button
                          onClick={() => { onAdd(p); setAddedId(p._id); setTimeout(() => setAddedId(null), 800); }}
                          disabled={p.stock <= 0}
                        >
                          {p.stock <= 0 ? 'Out' : addedId === p._id ? '✓ Added!' : '+ Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="chat-msg bot">Thinking…</div>}
          </div>
          <form className="chat-input" onSubmit={send}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about products…" />
            <button type="submit" disabled={busy}>Send</button>
          </form>
        </div>
      )}
    </>
  );
}