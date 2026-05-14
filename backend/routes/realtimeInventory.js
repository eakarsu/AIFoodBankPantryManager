// Real-time inventory: track shelf-life, auto-flag expiring items.
const router = require('express').Router();
const db = require('../db');

// GET /api/realtime-inventory/expiring?days=7
router.get('/expiring', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 60);
    const r = await db.query(`SELECT id, item, qty, expires_on, location FROM inventory WHERE expires_on IS NOT NULL AND expires_on <= NOW() + INTERVAL '1 day' * $1 ORDER BY expires_on ASC LIMIT 200`, [days]).catch(() => ({ rows: [] }));
    return res.json({ days, count: r.rows.length, expiring: r.rows });
  } catch (e) {
    return res.status(500).json({ error: 'expiring failed' });
  }
});

// POST /api/realtime-inventory/auto-distribute { item, qty }
router.post('/auto-distribute', async (req, res) => {
  const { item, qty } = req.body || {};
  if (!item || !qty) return res.status(400).json({ error: 'item + qty required' });
  return res.json({ item, qty: Number(qty), suggestion: 'add_to_next_distribution', notice: 'Wire to /api/distributions for execution.' });
});

module.exports = router;
