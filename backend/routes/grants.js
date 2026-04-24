const router = require('express').Router();
const db = require('../db');

// GET all grants
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM grants ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one grant
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM grants WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Grant not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create grant
router.post('/', async (req, res) => {
  try {
    const { name, grantor, amount, start_date, end_date, status, category, requirements, reporting_frequency, contact_name, contact_email, notes } = req.body;
    const { rows } = await db.query(
      `INSERT INTO grants (name, grantor, amount, start_date, end_date, status, category, requirements, reporting_frequency, contact_name, contact_email, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [name, grantor, amount, start_date, end_date, status || 'applied', category, requirements, reporting_frequency, contact_name, contact_email, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update grant
router.put('/:id', async (req, res) => {
  try {
    const { name, grantor, amount, start_date, end_date, status, category, requirements, reporting_frequency, contact_name, contact_email, notes } = req.body;
    const { rows } = await db.query(
      `UPDATE grants SET name=$1, grantor=$2, amount=$3, start_date=$4, end_date=$5, status=$6, category=$7, requirements=$8, reporting_frequency=$9, contact_name=$10, contact_email=$11, notes=$12
       WHERE id=$13 RETURNING *`,
      [name, grantor, amount, start_date, end_date, status, category, requirements, reporting_frequency, contact_name, contact_email, notes, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Grant not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE grant
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM grants WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Grant not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
