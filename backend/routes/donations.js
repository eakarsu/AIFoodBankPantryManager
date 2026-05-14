const router = require('express').Router();
const db = require('../db');

// GET all donations
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT d.*, dn.name as donor_name
       FROM financial_donations d
       LEFT JOIN donors dn ON d.donor_id = dn.id
       ORDER BY d.date DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET tax receipt for a donation
router.get('/tax-receipt/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT d.*, dn.name as donor_name, dn.address as donor_address, dn.tax_id as donor_tax_id, dn.email as donor_email
       FROM financial_donations d
       LEFT JOIN donors dn ON d.donor_id = dn.id
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Donation not found' });
    const donation = rows[0];
    res.json({
      receipt_number: donation.tax_receipt_number,
      date: donation.date,
      amount: donation.amount,
      method: donation.method,
      designation: donation.designation,
      donor: {
        name: donation.donor_name,
        address: donation.donor_address,
        tax_id: donation.donor_tax_id,
        email: donation.donor_email
      },
      organization: 'AI Food Bank & Pantry',
      tax_exempt_status: '501(c)(3)',
      statement: 'No goods or services were provided in exchange for this contribution.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one donation
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT d.*, dn.name as donor_name
       FROM financial_donations d
       LEFT JOIN donors dn ON d.donor_id = dn.id
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Donation not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create donation
router.post('/', async (req, res) => {
  try {
    const { donor_id, amount, date, method, designation, tax_receipt_number, tax_receipt_sent, notes } = req.body;
    if (!donor_id) {
      return res.status(400).json({ error: 'Missing required field: donor_id' });
    }
    if (amount === undefined || amount === null || amount === '') {
      return res.status(400).json({ error: 'Missing required field: amount' });
    }
    const { rows } = await db.query(
      `INSERT INTO financial_donations (donor_id, amount, date, method, designation, tax_receipt_number, tax_receipt_sent, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [donor_id, amount, date || new Date(), method, designation, tax_receipt_number, tax_receipt_sent || false, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update donation
router.put('/:id', async (req, res) => {
  try {
    const { donor_id, amount, date, method, designation, tax_receipt_number, tax_receipt_sent, notes } = req.body;
    const { rows } = await db.query(
      `UPDATE financial_donations SET donor_id=$1, amount=$2, date=$3, method=$4, designation=$5, tax_receipt_number=$6, tax_receipt_sent=$7, notes=$8
       WHERE id=$9 RETURNING *`,
      [donor_id, amount, date, method, designation, tax_receipt_number, tax_receipt_sent, notes, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Donation not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE donation
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM financial_donations WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Donation not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
