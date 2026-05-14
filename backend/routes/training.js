// Volunteer training / certification — Apply pass 5 (NEEDS-PRODUCT-DECISION).
//
// PRODUCT-DECISION: the audit asks for "volunteer training / certification
// curricula". Pick a reasonable default:
//   - Three baseline curriculum tracks (food-safety, intake-empathy, warehouse-safety).
//   - Each track has a hard-coded list of modules until a CMS is chosen.
//   - Volunteer progress is tracked by `volunteer_training` rows
//     (CREATE TABLE IF NOT EXISTS).
//   - LMS/SCORM integration deferred — most food banks already use ServSafe
//     or a state-provided curriculum and we don't want to override that
//     without sign-off.
const router = require('express').Router();
const db = require('../db');

const DEFAULT_TRACKS = [
  {
    id: 'food-safety',
    title: 'Food Safety Fundamentals',
    modules: [
      { id: 'fs1', title: 'Personal hygiene & PPE', minutes: 15 },
      { id: 'fs2', title: 'Temperature control & cold chain', minutes: 20 },
      { id: 'fs3', title: 'Cross-contamination prevention', minutes: 15 },
      { id: 'fs4', title: 'Allergen awareness', minutes: 10 },
    ],
  },
  {
    id: 'intake-empathy',
    title: 'Client Intake & Trauma-Informed Service',
    modules: [
      { id: 'ie1', title: 'Confidentiality & dignity', minutes: 15 },
      { id: 'ie2', title: 'De-escalation basics', minutes: 20 },
      { id: 'ie3', title: 'Cultural competency', minutes: 15 },
    ],
  },
  {
    id: 'warehouse-safety',
    title: 'Warehouse & Forklift Safety',
    modules: [
      { id: 'ws1', title: 'Lifting technique & PPE', minutes: 10 },
      { id: 'ws2', title: 'Pallet jack operation', minutes: 20 },
      { id: 'ws3', title: 'Emergency procedures', minutes: 15 },
    ],
  },
];

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS volunteer_training (
      id SERIAL PRIMARY KEY,
      volunteer_id INTEGER,
      track_id VARCHAR(64),
      module_id VARCHAR(64),
      completed_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
}

router.get('/tracks', (req, res) => res.json(DEFAULT_TRACKS));

router.get('/progress/:volunteer_id', async (req, res) => {
  try {
    await ensureTable();
    const r = await db.query(
      `SELECT track_id, module_id, completed_at FROM volunteer_training WHERE volunteer_id = $1 ORDER BY completed_at DESC`,
      [req.params.volunteer_id]
    );
    res.json({ volunteer_id: Number(req.params.volunteer_id), completions: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/complete', async (req, res) => {
  try {
    await ensureTable();
    const { volunteer_id, track_id, module_id } = req.body || {};
    if (!volunteer_id || !track_id || !module_id) return res.status(400).json({ error: 'volunteer_id + track_id + module_id required' });
    const r = await db.query(
      `INSERT INTO volunteer_training (volunteer_id, track_id, module_id) VALUES ($1, $2, $3) RETURNING id, completed_at`,
      [volunteer_id, track_id, module_id]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
