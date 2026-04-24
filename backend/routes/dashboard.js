const router = require('express').Router();
const db = require('../db');

// GET dashboard aggregate stats
router.get('/', async (req, res) => {
  try {
    const [
      clientsResult,
      visitsResult,
      inventoryResult,
      volunteersResult,
      distributionsResult,
      donorsResult,
      grantsResult,
      donationsResult
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as total FROM clients'),
      db.query(`SELECT COUNT(*) as total FROM visits WHERE visit_date >= date_trunc('month', CURRENT_DATE)`),
      db.query(`SELECT COALESCE(SUM(weight_lbs), 0) as total FROM inventory WHERE status = 'available'`),
      db.query(`SELECT COUNT(*) as total FROM volunteers WHERE status = 'active'`),
      db.query(`SELECT COUNT(*) as total FROM distributions WHERE status IN ('scheduled', 'in-progress') AND date >= CURRENT_DATE`),
      db.query(`SELECT COUNT(*) as total FROM donors WHERE status = 'active'`),
      db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM grants WHERE status IN ('awarded', 'active')`),
      db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM financial_donations WHERE date >= date_trunc('month', CURRENT_DATE)`)
    ]);

    res.json({
      total_clients: parseInt(clientsResult.rows[0].total),
      total_visits_this_month: parseInt(visitsResult.rows[0].total),
      total_inventory_lbs: parseFloat(inventoryResult.rows[0].total),
      total_volunteers: parseInt(volunteersResult.rows[0].total),
      upcoming_distributions: parseInt(distributionsResult.rows[0].total),
      active_donors: parseInt(donorsResult.rows[0].total),
      active_grants_value: parseFloat(grantsResult.rows[0].total),
      total_donations_this_month: parseFloat(donationsResult.rows[0].total)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
