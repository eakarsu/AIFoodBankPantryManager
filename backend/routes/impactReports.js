// Annual impact report templates — Apply pass 5 (NEEDS-PRODUCT-DECISION).
//
// PRODUCT-DECISION: the audit asks for "annual report / impact metrics
// templates". Pick a reasonable default schema based on Feeding America's
// shared metrics:
//   - meals_distributed (lbs / 1.2 conversion factor — Feeding America)
//   - households_served (distinct clients with at least one visit in period)
//   - new_clients (registered_at within period)
//   - donor_count, total_dollars_raised
//   - volunteer_hours (sum of hours_logged in volunteers table)
// Real templates / branded PDF export deferred — those need design + legal
// sign-off (logos, mission language, financial audit numbers).
const router = require('express').Router();
const db = require('../db');

router.get('/annual', async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    const lbs = await db.query(
      `SELECT COALESCE(SUM(weight_lbs),0)::numeric AS lbs FROM distributions WHERE distribution_date BETWEEN $1 AND $2`,
      [start, end]
    ).catch(() => ({ rows: [{ lbs: 0 }] }));
    const householdsR = await db.query(
      `SELECT COUNT(DISTINCT client_id)::int AS n FROM visits WHERE visited_at BETWEEN $1 AND $2`,
      [start, end]
    ).catch(() => ({ rows: [{ n: 0 }] }));
    const newClientsR = await db.query(
      `SELECT COUNT(*)::int AS n FROM clients WHERE registered_at BETWEEN $1 AND $2`,
      [start, end]
    ).catch(() => ({ rows: [{ n: 0 }] }));
    const donorsR = await db.query(
      `SELECT COUNT(DISTINCT donor_id)::int AS donors, COALESCE(SUM(amount),0)::numeric AS total
       FROM financial_donations WHERE date BETWEEN $1 AND $2`,
      [start, end]
    ).catch(() => ({ rows: [{ donors: 0, total: 0 }] }));
    const volR = await db.query(
      `SELECT COALESCE(SUM(hours_logged),0)::numeric AS hours FROM volunteers WHERE updated_at BETWEEN $1 AND $2`,
      [start, end]
    ).catch(() => ({ rows: [{ hours: 0 }] }));

    const lbsTotal = Number(lbs.rows[0]?.lbs || 0);
    res.json({
      year,
      meals_distributed: Math.round(lbsTotal / 1.2),
      lbs_distributed: lbsTotal,
      households_served: householdsR.rows[0]?.n || 0,
      new_clients: newClientsR.rows[0]?.n || 0,
      donor_count: donorsR.rows[0]?.donors || 0,
      total_dollars_raised: Number(donorsR.rows[0]?.total || 0),
      volunteer_hours: Number(volR.rows[0]?.hours || 0),
      methodology_note: 'Lbs-to-meals conversion uses Feeding America factor (1.2 lbs ≈ 1 meal).',
      generated_at: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
