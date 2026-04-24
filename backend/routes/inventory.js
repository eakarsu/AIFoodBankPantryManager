const router = require('express').Router();
const db = require('../db');

// GET all inventory
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT i.*, w.name as warehouse_name
       FROM inventory i
       LEFT JOIN warehouses w ON i.warehouse_id = w.id
       ORDER BY i.expiration_date ASC NULLS LAST`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one inventory item
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT i.*, w.name as warehouse_name
       FROM inventory i
       LEFT JOIN warehouses w ON i.warehouse_id = w.id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create inventory item
router.post('/', async (req, res) => {
  try {
    const { name, category, source, quantity, unit, weight_lbs, expiration_date, storage_type, warehouse_id, barcode, min_stock_level, status } = req.body;
    const { rows } = await db.query(
      `INSERT INTO inventory (name, category, source, quantity, unit, weight_lbs, expiration_date, storage_type, warehouse_id, barcode, min_stock_level, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [name, category, source, quantity, unit, weight_lbs, expiration_date, storage_type, warehouse_id, barcode, min_stock_level, status || 'available']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update inventory item
router.put('/:id', async (req, res) => {
  try {
    const { name, category, source, quantity, unit, weight_lbs, expiration_date, storage_type, warehouse_id, barcode, min_stock_level, status } = req.body;
    const { rows } = await db.query(
      `UPDATE inventory SET name=$1, category=$2, source=$3, quantity=$4, unit=$5, weight_lbs=$6, expiration_date=$7, storage_type=$8, warehouse_id=$9, barcode=$10, min_stock_level=$11, status=$12
       WHERE id=$13 RETURNING *`,
      [name, category, source, quantity, unit, weight_lbs, expiration_date, storage_type, warehouse_id, barcode, min_stock_level, status, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE inventory item
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM inventory WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
