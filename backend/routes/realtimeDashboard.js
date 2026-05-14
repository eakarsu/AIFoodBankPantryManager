// Real-time dashboard summary — Apply pass 5 (custom feature, additive).
//
// Original audit / pass-2 backlog: "Real-time inventory dashboard". This
// endpoint is a single SQL aggregate that the existing `pages/Dashboard.jsx`
// can poll on a short interval. Schema-tolerant.
const router = require('express').Router();
const db = require('../db');

router.get('/snapshot', async (req, res) => {
  try {
    const inv = await db.query(
      `SELECT category, COALESCE(SUM(weight_lbs),0)::numeric AS lbs
       FROM inventory WHERE status = 'available'
       GROUP BY category ORDER BY lbs DESC`
    ).catch(() => ({ rows: [] }));
    const today = await db.query(
      `SELECT COUNT(*)::int AS visits
       FROM visits WHERE visited_at::date = CURRENT_DATE`
    ).catch(() => ({ rows: [{ visits: 0 }] }));
    const expiring = await db.query(
      `SELECT id, name, category, weight_lbs, expiration_date
       FROM inventory
       WHERE status = 'available' AND expiration_date IS NOT NULL
         AND expiration_date <= CURRENT_DATE + INTERVAL '7 days'
       ORDER BY expiration_date ASC LIMIT 25`
    ).catch(() => ({ rows: [] }));
    const lowDonors = await db.query(
      `SELECT id, name, last_donation_date FROM donors
       WHERE last_donation_date < CURRENT_DATE - INTERVAL '180 days'
       ORDER BY last_donation_date ASC LIMIT 25`
    ).catch(() => ({ rows: [] }));

    res.json({
      inventory_by_category: inv.rows,
      visits_today: today.rows[0]?.visits || 0,
      expiring_soon: expiring.rows,
      lapsed_donors: lowDonors.rows,
      generated_at: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
