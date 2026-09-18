// Day 6 - aiService.js : FinalAIService ported to 2026
// Chain: Gemini (free) -> DeepSeek (optional) -> OpenAI (optional) -> Smart Mock
// Kept from 2025: provider chain, usage stats, 5-min cache, boot status.
// Modernized: built-in fetch (no axios/openai SDK), per-call system prompts, current model IDs.

class AIService {
  constructor() {
    this.providers = { gemini: null, deepseek: null, openai: null };
    this.usageStats = {
      gemini:    { success: 0, error: 0 },
      deepseek:  { success: 0, error: 0 },
      openai:    { success: 0, error: 0 },
      smartmock: { success: 0, error: 0 }
    };
    this.responseCache = new Map();   // key -> { text, provider }
    this.initializeProviders();
  }

  initializeProviders() {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 20) {
      this.providers.gemini = {
        apiKey: process.env.GEMINI_API_KEY.trim(),
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview'
      };
    }
    if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.startsWith('sk-')) {
      this.providers.deepseek = { apiKey: process.env.DEEPSEEK_API_KEY.trim() };
    }
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
      this.providers.openai = { apiKey: process.env.OPENAI_API_KEY.trim() };
    }
  }

  statusLine() {
    const m = (p) => (p ? '✅' : '❌');
    return `Gemini ${m(this.providers.gemini)} -> DeepSeek ${m(this.providers.deepseek)} -> OpenAI ${m(this.providers.openai)} -> Mock ✅`;
  }

  async queryAI(prompt, systemPrompt) {
    const cacheKey = `ai_${Buffer.from(systemPrompt + '|' + prompt).toString('base64')}`;
    if (this.responseCache.has(cacheKey)) {
      console.log('💾 AI cache hit');
      return this.responseCache.get(cacheKey);
    }

    const chain = [
      { name: 'gemini',   fn: () => this.queryGemini(prompt, systemPrompt) },
      { name: 'deepseek', fn: () => this.queryDeepSeek(prompt, systemPrompt) },
      { name: 'openai',   fn: () => this.queryOpenAI(prompt, systemPrompt) }
    ];

    for (const p of chain) {
      if (!this.providers[p.name]) continue;
      try {
        console.log(`🔄 AI: trying ${p.name}…`);
        const text = await p.fn();
        this.usageStats[p.name].success++;
        console.log(`✅ AI: ${p.name} answered`);
        const result = { text, provider: p.name };
        this.responseCache.set(cacheKey, result);
        setTimeout(() => this.responseCache.delete(cacheKey), 5 * 60 * 1000).unref();
        return result;
      } catch (err) {
        this.usageStats[p.name].error++;
        const quota = /quota|429|402|rate/i.test(err.message);
        console.log(`❌ AI: ${p.name} ${quota ? 'quota/rate limit' : 'failed'}: ${err.message.substring(0, 90)}`);
      }
    }

    console.log('🎭 AI: Smart Mock fallback');
    this.usageStats.smartmock.success++;
    return { text: this.getSmartMockResponse(prompt), provider: 'smartmock' };
  }

  async postJSON(url, body, headers = {}, timeoutMs = 30000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: ctrl.signal
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async queryGemini(prompt, systemPrompt) {
    const { apiKey, model } = this.providers.gemini;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const data = await this.postJSON(url, {
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
      // Gemini 3.x thinks before it answers — reasoning tokens count against
      // maxOutputTokens, so 600 truncates the JSON mid-stream. 2000 leaves room.
      generationConfig: { temperature: 0.4, maxOutputTokens: 2000 }
    });
    // Thinking models return MULTIPLE parts (thought parts + answer parts).
    // parts[0] alone grabs a fragment — join all non-thought parts.
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.filter(p => !p.thought).map(p => p.text || '').join('');
    if (!text) throw new Error('Unexpected Gemini response structure');
    return text;
  }

  async queryDeepSeek(prompt, systemPrompt) {
    const data = await this.postJSON(
      'https://api.deepseek.com/chat/completions',
      {
        model: 'deepseek-flash',   // 2026 ID — 'deepseek-chat' alias retired 2026-07-24
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600, temperature: 0.4, stream: false
      },
      { Authorization: `Bearer ${this.providers.deepseek.apiKey}` }
    );
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      console.log('🔍 DeepSeek raw:', JSON.stringify(data).substring(0, 300));
      throw new Error('Unexpected DeepSeek response structure');
    }
    return text;
  }

  async queryOpenAI(prompt, systemPrompt) {
    const data = await this.postJSON(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600, temperature: 0.4
      },
      { Authorization: `Bearer ${this.providers.openai.apiKey}` }
    );
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Unexpected OpenAI response structure');
    return text;
  }

  // Shop-domain Smart Mock — deterministic, honest, always available
  getSmartMockResponse(prompt) {
    const q = prompt.toLowerCase();
    if (/playstation|xbox|nintendo|iphone|samsung/.test(q)) {
      return `We don't carry that one — our catalog covers electronics, fitness, home and books. ` +
        `Closest in spirit: the Smart Fitness Watch ($129) or the 27-inch QHD Monitor ($249). ` +
        `(Smart Mock: no live AI key configured — set GEMINI_API_KEY for full answers.)`;
    }
    if (/yoga|mat|stretch/.test(q)) {
      return `For yoga we have the **Non-Slip Yoga Mat 6mm** at $29 (fitness category). ` +
        `Pairs well with the Resistance Bands Set of 5 ($19). (Smart Mock reply.)`;
    }
    if (/gift|present|birthday/.test(q)) {
      return `Gift ideas from our real catalog: Ceramic Coffee Mug Set of 4 ($24), ` +
        `Scented Candle Gift Set ($32), or Atomic Habits ($22). All under $35! (Smart Mock reply.)`;
    }
    if (/order|shipping|delivery|track/.test(q)) {
      return `You can see your orders anytime via "My orders" (top right). ` +
        `Statuses flow pending -> paid -> shipped -> delivered. (Smart Mock reply.)`;
    }
    return `I'm the NeoMart shop assistant — I can help with our 20 products across ` +
      `electronics, fitness, home and books. Try: "what's good for a home office?" ` +
      `or "cheap gifts for runners".`;
  }

  getStats() {
    const total = Object.values(this.usageStats).reduce((t, s) => t + s.success + s.error, 0);
    return {
      stats: this.usageStats,
      totalRequests: total,
      cacheSize: this.responseCache.size,
      providers: {
        gemini: !!this.providers.gemini,
        deepseek: !!this.providers.deepseek,
        openai: !!this.providers.openai
      }
    };
  }
}

module.exports = new AIService();