// Mobile app for clients: self-service pantry reservations, pickup scheduling.
const router = require('express').Router();
const db = require('../db');

// POST /api/client-mobile/reserve { client_id, pickup_slot_iso, items? }
router.post('/reserve', async (req, res) => {
  try {
    const { client_id, pickup_slot_iso, items } = req.body || {};
    if (!client_id || !pickup_slot_iso) return res.status(400).json({ error: 'client_id + pickup_slot_iso required' });
    const when = new Date(pickup_slot_iso);
    if (Number.isNaN(when.getTime())) return res.status(400).json({ error: 'invalid pickup_slot_iso' });
    let id = null;
    try {
      const r = await db.query(`INSERT INTO visits (client_id, scheduled_for, items, status, created_at) VALUES ($1,$2,$3,'reserved',NOW()) RETURNING id`, [client_id, when, JSON.stringify(items || [])]);
      id = r.rows[0].id;
    } catch {}
    return res.json({ id, client_id, pickup_slot: when.toISOString(), status: 'reserved' });
  } catch (e) {
    return res.status(500).json({ error: 'reserve failed' });
  }
});

// GET /api/client-mobile/slots?date=YYYY-MM-DD
router.get('/slots', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const slots = [];
    for (let h = 9; h <= 17; h++) {
      for (const m of [0, 30]) {
        slots.push(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      }
    }
    // Filter occupied
    const occupied = await db.query(`SELECT scheduled_for FROM visits WHERE scheduled_for::date = $1::date AND status = 'reserved'`, [date]).catch(() => ({ rows: [] }));
    const taken = new Set(occupied.rows.map(r => new Date(r.scheduled_for).toISOString()));
    return res.json({ date, available_slots: slots.filter(s => !taken.has(new Date(s).toISOString())) });
  } catch (e) {
    return res.status(500).json({ error: 'slots failed' });
  }
});

module.exports = router;
