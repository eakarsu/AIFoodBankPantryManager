const router = require('express').Router();
const db = require('../db');

// GET all delivery routes
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM delivery_routes ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one delivery route
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM delivery_routes WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Delivery route not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create delivery route
router.post('/', async (req, res) => {
  try {
    const { name, driver, vehicle_id, date, status, stops, total_miles, estimated_time, notes } = req.body;
    const { rows } = await db.query(
      `INSERT INTO delivery_routes (name, driver, vehicle_id, date, status, stops, total_miles, estimated_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, driver, vehicle_id, date, status || 'planned', JSON.stringify(stops || []), total_miles, estimated_time, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update delivery route
router.put('/:id', async (req, res) => {
  try {
    const { name, driver, vehicle_id, date, status, stops, total_miles, estimated_time, notes } = req.body;
    const { rows } = await db.query(
      `UPDATE delivery_routes SET name=$1, driver=$2, vehicle_id=$3, date=$4, status=$5, stops=$6, total_miles=$7, estimated_time=$8, notes=$9
       WHERE id=$10 RETURNING *`,
      [name, driver, vehicle_id, date, status, JSON.stringify(stops || []), total_miles, estimated_time, notes, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Delivery route not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE delivery route
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM delivery_routes WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Delivery route not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
