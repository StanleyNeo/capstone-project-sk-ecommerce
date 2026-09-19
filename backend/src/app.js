// Day 3 (M10) - app.js : middleware + route wiring (no logic here)
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');        // ← ADD THIS
const aiRoutes = require('./routes/aiRoutes');            // ← ADD
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// app.use(cors());                    // Day 4 frontend (port 3000) calls this API
// Phase 3: comma-separated allowlist — localhost for dev, Vercel domain for prod
const allowed = (process.env.CLIENT_URLS || 'http://localhost:3000').split(',');
app.use(cors({ origin: allowed }));
app.use(express.json());            // parse JSON bodies
app.use(morgan('dev'));             // one log line per request — watch it during demos

// health check — Render/Vercel-style hosts ping this in Phase 3
app.get('/api/health', (req, res) =>
  res.json({ success: true, service: 'ecommerce-api', version: '1.0', time: new Date().toISOString() }));

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);                        // ← ADD THIS
app.use('/api', aiRoutes);   // /api/chatbot/chat · /api/search/smart · /api/ai/stats

app.use(notFound);                  // nothing matched -> 404 envelope
app.use(errorHandler);              // anything thrown -> translated error



module.exports = app;