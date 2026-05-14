// Supply chain transparency: know food provenance, food miles, sustainability.
const router = require('express').Router();
const db = require('../db');

// GET /api/supply-transparency/item/:id
router.get('/item/:id', async (req, res) => {
  try {
    const r = await db.query(`SELECT i.id, i.item, i.qty, i.source, d.donor_name AS donated_by, d.origin_zip
                              FROM inventory i LEFT JOIN donations d ON d.inventory_id = i.id
                              WHERE i.id = $1`, [req.params.id]).catch(() => ({ rows: [] }));
    if (!r.rows[0]) return res.status(404).json({ error: 'item not found' });
    return res.json({ item: r.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: 'lookup failed' });
  }
});

// GET /api/supply-transparency/sustainability
router.get('/sustainability', async (_req, res) => {
  try {
    const r = await db.query(`SELECT source, COUNT(*) AS n FROM inventory GROUP BY source ORDER BY n DESC LIMIT 50`).catch(() => ({ rows: [] }));
    return res.json({ sources: r.rows });
  } catch (e) {
    return res.status(500).json({ error: 'sustainability failed' });
  }
});

module.exports = router;
