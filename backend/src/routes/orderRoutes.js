// Day 3 (M12) - orderRoutes.js : POST create order + GET orders by user
const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');

const router = express.Router();

// POST /api/orders    body: { userId, items: [{ productId, qty }] }
// 400 missing/bad fields · 404 unknown user or product · 409 insufficient stock
router.post('/', async (req, res, next) => {
  try {
    const { userId, items } = req.body;

    // ---- 400: request shape ----
    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'userId and a non-empty items array are required' });
    }
    for (const it of items) {
      if (!it.productId || !Number.isInteger(it.qty) || it.qty < 1) {
        return res.status(400).json({ success: false, error: 'Each item needs productId and integer qty >= 1' });
      }
    }
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, error: `Invalid userId: ${userId}` });
    }

    // ---- 404: user must exist ----
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: `User not found: ${userId}` });
    }

    // ---- resolve products + stock check (409) BEFORE touching anything ----
    const lines = [];
    for (const it of items) {
      if (!mongoose.isValidObjectId(it.productId)) {
        return res.status(400).json({ success: false, error: `Invalid productId: ${it.productId}` });
      }
      const product = await Product.findById(it.productId);
      if (!product) {
        return res.status(404).json({ success: false, error: `Product not found: ${it.productId}` });
      }
      if (product.stock < it.qty) {
        return res.status(409).json({
          success: false,
          error: `Insufficient stock for "${product.name}": requested ${it.qty}, available ${product.stock}`
        });
      }
      lines.push({ product, qty: it.qty });
    }

    // ---- all checks passed: decrement stock, then create the order ----
    for (const { product, qty } of lines) {
      product.stock -= qty;
      await product.save();
    }

    const order = await Order.create({
      userId: user._id,
      items: lines.map(({ product, qty }) => ({ productId: product._id, qty, price: product.price })),
      total: lines.reduce((sum, { product, qty }) => sum + product.price * qty, 0),
      status: 'pending'
    });

    res.status(201).json({ success: true, count: 1, data: order });
  } catch (err) { next(err); }
});

// GET /api/orders/:userId   (order history, newest first, product details joined in)
router.get('/:userId', async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .populate('items.productId', 'name price image')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) { next(err); }   // CastError -> 400 via errorHandler
});

module.exports = router;