const router = require('express').Router();
const db = require('../db');

// GET all food drives
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM food_drives ORDER BY start_date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one food drive
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM food_drives WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Food drive not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create food drive
router.post('/', async (req, res) => {
  try {
    const { name, organizer, start_date, end_date, goal_lbs, collected_lbs, location, status, donation_count, notes } = req.body;
    const { rows } = await db.query(
      `INSERT INTO food_drives (name, organizer, start_date, end_date, goal_lbs, collected_lbs, location, status, donation_count, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, organizer, start_date, end_date, goal_lbs, collected_lbs || 0, location, status || 'planned', donation_count || 0, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update food drive
router.put('/:id', async (req, res) => {
  try {
    const { name, organizer, start_date, end_date, goal_lbs, collected_lbs, location, status, donation_count, notes } = req.body;
    const { rows } = await db.query(
      `UPDATE food_drives SET name=$1, organizer=$2, start_date=$3, end_date=$4, goal_lbs=$5, collected_lbs=$6, location=$7, status=$8, donation_count=$9, notes=$10
       WHERE id=$11 RETURNING *`,
      [name, organizer, start_date, end_date, goal_lbs, collected_lbs, location, status, donation_count, notes, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Food drive not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE food drive
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM food_drives WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Food drive not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
