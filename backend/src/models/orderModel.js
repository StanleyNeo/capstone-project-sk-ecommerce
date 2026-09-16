// Day 2 (M11) - orderModel.js (adapted from 2025 enrollmentModel.js)
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  qty:       { type: Number, required: true, min: 1 },
  price:     { type: Number, required: true, min: 0 }   // price AT TIME OF ORDER
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:     { type: [orderItemSchema], required: true },
  total:     { type: Number, required: true, min: 0 },
  status:    { type: String, enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
               default: 'paid' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);