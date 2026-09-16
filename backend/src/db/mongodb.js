// Day 2 (M11) - mongodb.js : single connection module used by seed.js AND the API
const mongoose = require('mongoose');

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.name} @ ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;