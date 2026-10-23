'use strict';
// Feature pack wave 1A: authenticated tasks, inventory search/filter,
// CSV/JSON export, and domain AI with deterministic fallback.
// Mounted at /api/feature-pack (global /api auth middleware applies).
const router = require('express').Router();
const db = require('../db');
const { filterInventory, toCsv, toJsonExport, renderAiSections, hasAiKey, buildFallback } = require('../domain/featurePack');

let tasksReady = null;
function ensureTasks() {
  if (!tasksReady) {
    tasksReady = db.query(`CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY, title TEXT NOT NULL, status TEXT DEFAULT 'open',
      assignee TEXT, due_date DATE, notes TEXT,
      created_by INTEGER, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`)
      .catch((e) => { tasksReady = null; throw e; });
  }
  return tasksReady;
}

// --- Tasks (authenticated list/create/update) ---
router.get('/tasks', async (req, res) => {
  try {
    await ensureTasks();
    const { rows } = await db.query('SELECT * FROM tasks ORDER BY id DESC LIMIT 200');
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/tasks', async (req, res) => {
  try {
    const { title, status, assignee, due_date, notes } = req.body || {};
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'title is required' });
    await ensureTasks();
    const { rows } = await db.query(
      'INSERT INTO tasks (title,status,assignee,due_date,notes,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [String(title).trim(), status || 'open', assignee || null, due_date || null, notes || null, req.user?.id || null]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/tasks/:id', async (req, res) => {
  try {
    await ensureTasks();
    const { title, status, assignee, due_date, notes } = req.body || {};
    const { rows } = await db.query(
      `UPDATE tasks SET title=COALESCE($1,title), status=COALESCE($2,status), assignee=COALESCE($3,assignee),
       due_date=COALESCE($4,due_date), notes=COALESCE($5,notes), updated_at=NOW() WHERE id=$6 RETURNING *`,
      [title ?? null, status ?? null, assignee ?? null, due_date ?? null, notes ?? null, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Search/filter on the main record list (inventory) ---
router.get('/inventory/search', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM inventory ORDER BY id DESC LIMIT 1000');
    res.json({ data: filterInventory(rows, req.query), count: filterInventory(rows, req.query).length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CSV/JSON export of main records (inventory) ---
router.get('/inventory/export', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM inventory ORDER BY id DESC LIMIT 1000');
    const filtered = filterInventory(rows, req.query);
    if (String(req.query.format || 'csv').toLowerCase() === 'json') return res.json(toJsonExport(filtered));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory_export.csv"');
    res.send(toCsv(filtered));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Domain AI: real provider only when a key is configured, else fallback ---
const AI_FEATURES = ['restock-recommendation', 'distribution-summary', 'expiry-alert-draft'];
router.post('/ai/:feature', async (req, res) => {
  try {
    const feature = req.params.feature;
    if (!AI_FEATURES.includes(feature)) return res.status(400).json({ error: `Unknown feature. Use: ${AI_FEATURES.join(', ')}` });
    const { rows } = await db.query('SELECT * FROM inventory ORDER BY id DESC LIMIT 200');
    if (!hasAiKey()) {
      const result = buildFallback(feature, rows);
      return res.json({ ...result, sections: renderAiSections(result) });
    }
    const { callOpenRouter } = require('../openrouter');
    const prompt = `Feature: ${feature}. Inventory records (JSON): ${JSON.stringify(rows.slice(0, 50))}. Respond with a concise labelled summary.`;
    const text = await callOpenRouter([{ role: 'user', content: prompt }]);
    const result = { source: 'provider', aiGenerated: true, feature, text };
    res.json({ ...result, sections: renderAiSections(result) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
