const router = require('express').Router();
const db = require('../db');

// GET all warehouses
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM warehouses ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one warehouse
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM warehouses WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create warehouse
router.post('/', async (req, res) => {
  try {
    const { name, address, type, capacity_sqft, cooler_temp, freezer_temp, manager, phone, status, notes } = req.body;
    const { rows } = await db.query(
      `INSERT INTO warehouses (name, address, type, capacity_sqft, cooler_temp, freezer_temp, manager, phone, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, address, type, capacity_sqft, cooler_temp, freezer_temp, manager, phone, status || 'active', notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update warehouse
router.put('/:id', async (req, res) => {
  try {
    const { name, address, type, capacity_sqft, cooler_temp, freezer_temp, manager, phone, status, notes } = req.body;
    const { rows } = await db.query(
      `UPDATE warehouses SET name=$1, address=$2, type=$3, capacity_sqft=$4, cooler_temp=$5, freezer_temp=$6, manager=$7, phone=$8, status=$9, notes=$10
       WHERE id=$11 RETURNING *`,
      [name, address, type, capacity_sqft, cooler_temp, freezer_temp, manager, phone, status, notes, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE warehouse
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM warehouses WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Warehouse not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
