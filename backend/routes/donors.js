const router = require('express').Router();
const db = require('../db');

// GET all donors (paginated)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { rows: countRows } = await db.query('SELECT COUNT(*) AS total FROM donors');
    const total = parseInt(countRows[0].total, 10);
    const { rows } = await db.query('SELECT * FROM donors ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one donor
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM donors WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Donor not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create donor
router.post('/', async (req, res) => {
  try {
    const { name, type, email, phone, address, contact_person, donation_frequency, total_donated_lbs, total_donated_value, tax_id, notes, status } = req.body;
    const { rows } = await db.query(
      `INSERT INTO donors (name, type, email, phone, address, contact_person, donation_frequency, total_donated_lbs, total_donated_value, tax_id, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [name, type, email, phone, address, contact_person, donation_frequency, total_donated_lbs || 0, total_donated_value || 0, tax_id, notes, status || 'active']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update donor
router.put('/:id', async (req, res) => {
  try {
    const { name, type, email, phone, address, contact_person, donation_frequency, total_donated_lbs, total_donated_value, tax_id, notes, status } = req.body;
    const { rows } = await db.query(
      `UPDATE donors SET name=$1, type=$2, email=$3, phone=$4, address=$5, contact_person=$6, donation_frequency=$7, total_donated_lbs=$8, total_donated_value=$9, tax_id=$10, notes=$11, status=$12
       WHERE id=$13 RETURNING *`,
      [name, type, email, phone, address, contact_person, donation_frequency, total_donated_lbs, total_donated_value, tax_id, notes, status, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Donor not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE donor
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM donors WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Donor not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
