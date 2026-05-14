// Community needs assessment: survey clients, identify specific needs.
const router = require('express').Router();
const db = require('../db');

// POST /api/needs-assessment/submit { client_id, needs:{ formula:bool, gluten_free:bool, kosher:bool, halal:bool, diabetic:bool, baby:bool, elderly:bool, language:'en|es|...' } }
router.post('/submit', async (req, res) => {
  try {
    const { client_id, needs } = req.body || {};
    if (!client_id || !needs) return res.status(400).json({ error: 'client_id + needs required' });
    try {
      await db.query(`INSERT INTO needs_assessments (client_id, needs, created_at) VALUES ($1,$2,NOW()) ON CONFLICT (client_id) DO UPDATE SET needs = EXCLUDED.needs, created_at = NOW()`, [client_id, JSON.stringify(needs)]);
    } catch {}
    return res.json({ client_id, accepted: true });
  } catch (e) {
    return res.status(500).json({ error: 'submit failed' });
  }
});

// GET /api/needs-assessment/aggregate
router.get('/aggregate', async (_req, res) => {
  try {
    const r = await db.query(`SELECT needs FROM needs_assessments LIMIT 5000`).catch(() => ({ rows: [] }));
    const tally = {};
    for (const row of r.rows) {
      const n = typeof row.needs === 'string' ? JSON.parse(row.needs) : row.needs;
      for (const k of Object.keys(n || {})) if (n[k]) tally[k] = (tally[k] || 0) + 1;
    }
    return res.json({ total: r.rows.length, tally });
  } catch (e) {
    return res.status(500).json({ error: 'aggregate failed' });
  }
});

module.exports = router;
