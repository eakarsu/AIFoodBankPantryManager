const router = require('express').Router();
const db = require('../db');

// GET all clients
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM clients ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one client
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create client
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, city, state, zip, household_size, income_level, dietary_restrictions, notes, is_homebound } = req.body;
    const { rows } = await db.query(
      `INSERT INTO clients (first_name, last_name, email, phone, address, city, state, zip, household_size, income_level, dietary_restrictions, notes, is_homebound)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [first_name, last_name, email, phone, address, city, state, zip, household_size, income_level, dietary_restrictions, notes, is_homebound || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update client
router.put('/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, city, state, zip, household_size, income_level, dietary_restrictions, notes, is_homebound } = req.body;
    const { rows } = await db.query(
      `UPDATE clients SET first_name=$1, last_name=$2, email=$3, phone=$4, address=$5, city=$6, state=$7, zip=$8, household_size=$9, income_level=$10, dietary_restrictions=$11, notes=$12, is_homebound=$13
       WHERE id=$14 RETURNING *`,
      [first_name, last_name, email, phone, address, city, state, zip, household_size, income_level, dietary_restrictions, notes, is_homebound, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE client
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
