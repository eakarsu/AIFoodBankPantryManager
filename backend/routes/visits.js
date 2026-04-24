const router = require('express').Router();
const db = require('../db');

// GET all visits
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT v.*, c.first_name || ' ' || c.last_name as client_name
       FROM visits v
       LEFT JOIN clients c ON v.client_id = c.id
       ORDER BY v.visit_date DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one visit
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT v.*, c.first_name, c.last_name
       FROM visits v
       LEFT JOIN clients c ON v.client_id = c.id
       WHERE v.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Visit not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create visit
router.post('/', async (req, res) => {
  try {
    const { client_id, visit_date, distribution_type, items_received, weight_lbs, notes, served_by } = req.body;
    const { rows } = await db.query(
      `INSERT INTO visits (client_id, visit_date, distribution_type, items_received, weight_lbs, notes, served_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [client_id, visit_date || new Date(), distribution_type, items_received, weight_lbs, notes, served_by]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update visit
router.put('/:id', async (req, res) => {
  try {
    const { client_id, visit_date, distribution_type, items_received, weight_lbs, notes, served_by } = req.body;
    const { rows } = await db.query(
      `UPDATE visits SET client_id=$1, visit_date=$2, distribution_type=$3, items_received=$4, weight_lbs=$5, notes=$6, served_by=$7
       WHERE id=$8 RETURNING *`,
      [client_id, visit_date, distribution_type, items_received, weight_lbs, notes, served_by, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Visit not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE visit
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM visits WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Visit not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
