// Day 5 - userRoutes.js : minimal identity lookup (stands in for auth)
const express = require('express');
const User = require('../models/userModel');

const router = express.Router();

// GET /api/users/lookup?email=demo@shop.test
router.get('/lookup', async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, error: 'email query param is required' });
    }
    const user = await User.findOne({ email: String(email).toLowerCase() })
                           .select('_id name email');   // never return password
    if (!user) {
      return res.status(404).json({ success: false, error: `User not found: ${email}` });
    }
    res.json({ success: true, count: 1, data: user });
  } catch (err) { next(err); }
});

module.exports = router;