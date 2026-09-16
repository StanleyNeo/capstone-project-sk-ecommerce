// Day 2 (M11) - productModel.js
// Adapted from 2025 courseModel.js. Generic field names (template rule).
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  price:       { type: Number, required: true, min: 0 },
  category:    { type: String, required: true, lowercase: true,
                 enum: ['electronics', 'fitness', 'home', 'books'] },
  description: { type: String, required: true },
  image:       { type: String, default: '' },
  stock:       { type: Number, default: 0, min: 0 },
  tags:        { type: [String], default: [] },       // powers Day 6 Smart Search
  createdAt:   { type: Date, default: Date.now }
});

// Text index for Smart Search (Day 6) - costs nothing today
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);