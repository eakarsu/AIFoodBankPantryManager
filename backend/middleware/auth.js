'use strict';
const jwt = require('jsonwebtoken');
module.exports = (req,res,next) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return res.status(401).json({ error:'Bearer token required' });
  try { req.user=jwt.verify(token,process.env.JWT_SECRET); next(); }
  catch (_) { res.status(403).json({ error:'Invalid or expired token' }); }
};
