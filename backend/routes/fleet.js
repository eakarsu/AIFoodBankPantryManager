const router = require('express').Router();
const db = require('../db');

// GET all fleet vehicles
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM fleet ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one fleet vehicle
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM fleet WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create fleet vehicle
router.post('/', async (req, res) => {
  try {
    const { name, type, make, model, year, license_plate, mileage, status, insurance_expiry, last_service, next_service, capacity_lbs, notes } = req.body;
    const { rows } = await db.query(
      `INSERT INTO fleet (name, type, make, model, year, license_plate, mileage, status, insurance_expiry, last_service, next_service, capacity_lbs, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [name, type, make, model, year, license_plate, mileage, status || 'available', insurance_expiry, last_service, next_service, capacity_lbs, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update fleet vehicle
router.put('/:id', async (req, res) => {
  try {
    const { name, type, make, model, year, license_plate, mileage, status, insurance_expiry, last_service, next_service, capacity_lbs, notes } = req.body;
    const { rows } = await db.query(
      `UPDATE fleet SET name=$1, type=$2, make=$3, model=$4, year=$5, license_plate=$6, mileage=$7, status=$8, insurance_expiry=$9, last_service=$10, next_service=$11, capacity_lbs=$12, notes=$13
       WHERE id=$14 RETURNING *`,
      [name, type, make, model, year, license_plate, mileage, status, insurance_expiry, last_service, next_service, capacity_lbs, notes, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE fleet vehicle
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM fleet WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
