// Day 2 (M11) - userModel.js (reused shape from 2025)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true,
               match: /.+@.+/ },                     // the "@" rule, server-side too
  password:  { type: String, required: true, minlength: 6 },  // plain text OK: prototype
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);