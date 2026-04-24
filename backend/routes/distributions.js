const router = require('express').Router();
const db = require('../db');

// GET all distributions
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM distributions ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one distribution
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM distributions WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Distribution not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create distribution
router.post('/', async (req, res) => {
  try {
    const { name, date, type, location, max_clients, registered_count, status, notes } = req.body;
    const { rows } = await db.query(
      `INSERT INTO distributions (name, date, type, location, max_clients, registered_count, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, date, type, location, max_clients, registered_count || 0, status || 'scheduled', notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update distribution
router.put('/:id', async (req, res) => {
  try {
    const { name, date, type, location, max_clients, registered_count, status, notes } = req.body;
    const { rows } = await db.query(
      `UPDATE distributions SET name=$1, date=$2, type=$3, location=$4, max_clients=$5, registered_count=$6, status=$7, notes=$8
       WHERE id=$9 RETURNING *`,
      [name, date, type, location, max_clients, registered_count, status, notes, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Distribution not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE distribution
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM distributions WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Distribution not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
