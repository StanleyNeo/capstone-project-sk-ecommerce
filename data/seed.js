// Day 2 (M11) - data/seed.js : idempotent demo data loader
// Run from repo root:  node data/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../backend/src/db/mongodb');
const Product = require('../backend/src/models/productModel');
const User = require('../backend/src/models/userModel');
const Order = require('../backend/src/models/orderModel');

const products = require('./products.json');
const users = require('./users.json');

async function seed() {
  await connectDB();

  await Promise.all([Product.deleteMany({}), User.deleteMany({}), Order.deleteMany({})]);
  console.log('🧹 Cleared collections: products, users, orders');

  const insertedProducts = await Product.insertMany(products);
  console.log(`✅ Inserted ${insertedProducts.length} products`);

  const cleanUsers = users.map(({ _note, ...u }) => u);   // strip doc-only field
  const insertedUsers = await User.insertMany(cleanUsers);
  console.log(`✅ Inserted ${insertedUsers.length} users`);

  // ---- sample orders for the demo account ----
  const demo = insertedUsers.find(u => u.email === 'demo@shop.test');
  const pick = (fragment) => {
    const p = insertedProducts.find(p => p.name.includes(fragment));
    if (!p) throw new Error(`Seed pick failed: no product containing "${fragment}"`);
    return p;
  };
  const item = (p, qty) => ({ productId: p._id, qty, price: p.price });
  const withTotal = (items, status) => ({
    userId: demo._id,
    items,
    total: items.reduce((sum, i) => sum + i.price * i.qty, 0),
    status
  });

  const ordersData = [
    withTotal([item(pick('Earbuds'), 1), item(pick('Mug'), 1)], 'delivered'),        // 63.90
    withTotal([item(pick('Running Shoes'), 1), item(pick('Resistance Bands'), 2)], 'shipped'), // 117.00
    withTotal([item(pick('Clean Code'), 1), item(pick('Pragmatic'), 1)], 'paid'),   // 87.00
    withTotal([item(pick('Air Fryer'), 1)], 'paid'),                                // 99.00
    withTotal([item(pick('Yoga Mat'), 1), item(pick('Candle'), 1)], 'pending')      // 61.00
  ];

  const insertedOrders = await Order.insertMany(ordersData);
  const grandTotal = insertedOrders.reduce((s, o) => s + o.total, 0);
  console.log(`✅ Created ${insertedOrders.length} sample orders for ${demo.email}`);
  console.log(`📦 Orders total value: $${grandTotal.toFixed(2)}`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected. Seed complete.');
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });