// Day 3 (M10) - server.js : entry point. Run from repo root: node backend/src/server.js
require('dotenv').config({ quiet: true });   // quiet: hide the dotenv tip line, keep banner clean
const connectDB = require('./db/mongodb');
const app = require('./app');
const Product = require('./models/productModel');
const User = require('./models/userModel');
const Order = require('./models/orderModel');

const PORT = process.env.PORT || 5000;

function printBanner() {
  console.log('');
  console.log('==============================================');
  console.log(' E-COMMERCE API  v1.0');
  console.log('==============================================');
  console.log(` Port: ${PORT}     URL: http://localhost:${PORT}`);
  console.log(' Database: Connected ✅');
  console.log(' AI chain: pending — arrives Day 6');
  console.log('');
  console.log(' Products:  GET  /api/products?category=&search=&minPrice=&maxPrice=&inStock=');
  console.log('            GET  /api/products/:id');
  console.log(' Orders:    POST /api/orders   (400 bad fields / 404 unknown / 409 out of stock)');
  console.log('            GET  /api/orders/:userId');
  console.log(' Users:     GET  /api/users/lookup?email=');          // ← ADD THIS  
  console.log(' AI:        (Day 6) POST /api/chatbot/chat · POST /api/search/smart');
  console.log(' Health:    GET  /api/health');
  console.log('==============================================');
}

async function start() {
  await connectDB();   // exits process on failure — no banner without DB

  const [p, u, o] = await Promise.all([
    Product.countDocuments(), User.countDocuments(), Order.countDocuments()
  ]);
  console.log(`✅ Data check: ${p} products / ${u} users / ${o} orders`);

  app.listen(PORT, printBanner);
}

start();