// Day 3 (M10/M12) - errorHandler.js : one error shape for the whole API

// Unknown route -> 404 in the SAME envelope
function notFound(req, res, next) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Anything thrown/passed via next(err) lands here
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Bad ObjectId (e.g. /api/products/abc) is a CLIENT error, not a server crash
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: `Invalid ${err.path}: ${err.value}` });
  }
  // Schema validation failure (e.g. bad order body hitting a model)
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map(e => e.message).join('; ');
    return res.status(400).json({ success: false, error: msg });
  }
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Server error' });
}

module.exports = { notFound, errorHandler };