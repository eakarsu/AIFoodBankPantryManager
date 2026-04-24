const router = require('express').Router();
const db = require('../db');

// GET all partners
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM partners ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one partner
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM partners WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Partner not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create partner
router.post('/', async (req, res) => {
  try {
    const { name, type, address, contact_name, contact_email, contact_phone, service_area, clients_served, status, agreement_date, notes } = req.body;
    const { rows } = await db.query(
      `INSERT INTO partners (name, type, address, contact_name, contact_email, contact_phone, service_area, clients_served, status, agreement_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, type, address, contact_name, contact_email, contact_phone, service_area, clients_served || 0, status || 'active', agreement_date, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update partner
router.put('/:id', async (req, res) => {
  try {
    const { name, type, address, contact_name, contact_email, contact_phone, service_area, clients_served, status, agreement_date, notes } = req.body;
    const { rows } = await db.query(
      `UPDATE partners SET name=$1, type=$2, address=$3, contact_name=$4, contact_email=$5, contact_phone=$6, service_area=$7, clients_served=$8, status=$9, agreement_date=$10, notes=$11
       WHERE id=$12 RETURNING *`,
      [name, type, address, contact_name, contact_email, contact_phone, service_area, clients_served, status, agreement_date, notes, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Partner not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE partner
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM partners WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Partner not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
