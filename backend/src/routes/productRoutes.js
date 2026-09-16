// Day 3 (M12) - productRoutes.js : GET list (with filters) + GET one
const express = require('express');
const Product = require('../models/productModel');

const router = express.Router();

// GET /api/products?category=&search=&minPrice=&maxPrice=&inStock=
router.get('/', async (req, res, next) => {
  try {
    const { category, search, minPrice, maxPrice, inStock } = req.query;
    const filter = {};

    if (category) filter.category = category.toLowerCase();

    if (search) {
      const rx = new RegExp(search, 'i');           // case-insensitive contains
      filter.$or = [{ name: rx }, { description: rx }, { tags: rx }];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (inStock === 'true')  filter.stock = { $gt: 0 };
    if (inStock === 'false') filter.stock = 0;

    const products = await Product.find(filter).sort({ category: 1, name: 1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (err) { next(err); }
});

// GET /api/products/:id   (400 bad id shape / 404 unknown id)
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);  // CastError -> 400 via errorHandler
    if (!product) {
      return res.status(404).json({ success: false, error: `Product not found: ${req.params.id}` });
    }
    res.json({ success: true, count: 1, data: product });
  } catch (err) { next(err); }
});

module.exports = router;