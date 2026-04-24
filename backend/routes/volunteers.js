const router = require('express').Router();
const db = require('../db');

// GET all volunteers
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM volunteers ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one volunteer
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM volunteers WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Volunteer not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create volunteer
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, role, availability, skills, background_check, emergency_contact, total_hours, status, start_date, notes } = req.body;
    const { rows } = await db.query(
      `INSERT INTO volunteers (name, email, phone, role, availability, skills, background_check, emergency_contact, total_hours, status, start_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [name, email, phone, role, availability, skills, background_check || false, emergency_contact, total_hours || 0, status || 'active', start_date, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update volunteer
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, role, availability, skills, background_check, emergency_contact, total_hours, status, start_date, notes } = req.body;
    const { rows } = await db.query(
      `UPDATE volunteers SET name=$1, email=$2, phone=$3, role=$4, availability=$5, skills=$6, background_check=$7, emergency_contact=$8, total_hours=$9, status=$10, start_date=$11, notes=$12
       WHERE id=$13 RETURNING *`,
      [name, email, phone, role, availability, skills, background_check, emergency_contact, total_hours, status, start_date, notes, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Volunteer not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE volunteer
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM volunteers WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Volunteer not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
