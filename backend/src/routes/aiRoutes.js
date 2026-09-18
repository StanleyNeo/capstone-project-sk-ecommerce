// Day 6 - aiRoutes.js : RAG-lite chatbot + 3-layer Smart Search
const express = require('express');
const Product = require('../models/productModel');
const aiService = require('../services/aiService');

const router = express.Router();

// ---------- POST /api/chatbot/chat  { message } ----------
router.post('/chatbot/chat', async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }

    // RAG-lite step 1: pre-filter real products by keywords from the message
    const words = message.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
    const clauses = words.map(w => {
      const rx = new RegExp(w, 'i');
      return { $or: [{ name: rx }, { tags: rx }, { category: rx }, { description: rx }] };
    });
    let candidates = clauses.length ? await Product.find({ $or: clauses }).limit(6) : [];
    if (candidates.length === 0) {
      candidates = await Product.find().sort({ price: 1 }).limit(3);  // cheap suggestions as fallback
    }

    // RAG-lite step 2: inject ONLY real data into the prompt
    const catalog = candidates.map(p => ({
      id: String(p._id), name: p.name, price: p.price, stock: p.stock, category: p.category
    }));
    const systemPrompt =
      `You are ShopBot, the assistant for an online store. ` +
      `Use ONLY the product list below — never invent products, prices or stock levels. ` +
      `If the user asks for something not in the list, say plainly that we don't carry it ` +
      `and suggest the closest item from the list. Be warm and concise (2-4 sentences). ` +
      `Answer as compact JSON only: {"reply":"...","productIds":["id1","id2"]} ` +
      `where productIds contains ONLY ids from the list that you actually mention. ` +
      `PRODUCT LIST: ${JSON.stringify(catalog)}`;

    const { text, provider } = await aiService.queryAI(message, systemPrompt);

    // Parse the structured reply; tolerate models that wrap JSON in prose
    let parsed;
    try {
      parsed = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
    } catch {
      parsed = { reply: text, productIds: [] };
    }

    // Only return products the model mentioned AND that really exist in candidates
    const validIds = (parsed.productIds || []).filter(id => catalog.some(c => c.id === String(id)));
    const mentioned = candidates.filter(p => validIds.includes(String(p._id)));

    res.json({ success: true, data: { reply: parsed.reply || text, products: mentioned, provider } });
  } catch (err) { next(err); }
});

// ---------- POST /api/search/smart  { query } ----------
const STOP = new Set(['the', 'for', 'and', 'with', 'under', 'below', 'best', 'good', 'some', 'any', 'that', 'this', 'want', 'need', 'looking', 'look']);

router.post('/search/smart', async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, error: 'query is required' });
    }
    const q = query.toLowerCase();

    // Layer 1 (deterministic): price intent
    let maxPrice = null;
    const m = q.match(/(?:under|below|less than|max)\s*\$?(\d+)/);
    if (m) maxPrice = Number(m[1]);
    else if (/\b(cheap|budget|affordable)\b/.test(q)) maxPrice = 50;

    // Layer 2 (2025 weighted scoring): tags +3, name +2, category +2, description +1
    const words = q.split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOP.has(w));
    const pool = await Product.find(maxPrice ? { price: { $lte: maxPrice } } : {});
    const scored = pool.map(p => {
      let score = 0;
      const name = p.name.toLowerCase(), desc = p.description.toLowerCase();
      const tags = p.tags.join(' ').toLowerCase(), cat = p.category.toLowerCase();
      for (const w of words) {
        const stem = w.replace(/s$/, '');          // gifts -> gift, bands -> band
        if (tags.includes(stem)) score += 3;
        if (name.includes(stem)) score += 2;
        if (cat.includes(stem)) score += 2;
        if (desc.includes(stem)) score += 1;
      }
      return { p, score };
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

    const results = scored.map(s => s.p);
    let interpreted = null;

    // Layer 3 (LLM, only when needed): interpret the query into categories/keywords
    if (results.length < 3) {
      const systemPrompt =
        `Map a shopping query to compact JSON only: {"categories":["..."],"keywords":["..."]}. ` +
        `categories must come from: electronics, fitness, home, books. keywords are singular product-tag words. ` +
        `No prose, JSON only.`;
      const { text } = await aiService.queryAI(`Shopping query: "${query}"`, systemPrompt);
      try {
        interpreted = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
      } catch { interpreted = null; }

      if (interpreted) {
        const extra = await Product.find({
          ...(maxPrice ? { price: { $lte: maxPrice } } : {}),
          $or: [
            { category: { $in: interpreted.categories || [] } },
            { tags: { $in: (interpreted.keywords || []).map(k => new RegExp(k, 'i')) } }
          ]
        });
        const seen = new Set(results.map(p => String(p._id)));
        for (const p of extra) {
          if (!seen.has(String(p._id))) results.push(p);
        }
      }
    }

    res.json({ success: true, count: results.length, data: results, meta: { maxPrice, interpreted } });
  } catch (err) { next(err); }
});

// ---------- GET /api/ai/stats  (demo gold: which provider answered, cache size) ----------
router.get('/ai/stats', (req, res) => {
  res.json({ success: true, data: aiService.getStats() });
});

module.exports = router;