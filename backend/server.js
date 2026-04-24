const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

app.use(cors({ origin: [`http://localhost:${process.env.FRONTEND_PORT || 3000}`], credentials: true }));
app.use(express.json());

// Auth middleware
const authMiddleware = (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.use('/api', authMiddleware);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/visits', require('./routes/visits'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/distributions', require('./routes/distributions'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/food-drives', require('./routes/foodDrives'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/delivery-routes', require('./routes/deliveryRoutes'));
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/grants', require('./routes/grants'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/fleet', require('./routes/fleet'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/ai', require('./routes/ai'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
