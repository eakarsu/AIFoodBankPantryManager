// Volunteer training: onboarding, certification, skill tracking.
const router = require('express').Router();
const db = require('../db');

const MODULES = ['food_safety', 'client_interaction', 'forklift', 'cold_chain', 'allergens'];

// POST /api/volunteer-training/enrol { volunteer_id, module }
router.post('/enrol', async (req, res) => {
  const { volunteer_id, module } = req.body || {};
  if (!volunteer_id || !module) return res.status(400).json({ error: 'volunteer_id + module required' });
  if (!MODULES.includes(module)) return res.status(400).json({ error: `module must be one of ${MODULES.join(',')}` });
  try {
    await db.query(`INSERT INTO volunteer_trainings (volunteer_id, module, status, enrolled_at) VALUES ($1,$2,'in_progress',NOW())`, [volunteer_id, module]);
  } catch {}
  return res.json({ volunteer_id, module, status: 'in_progress' });
});

// POST /api/volunteer-training/complete { volunteer_id, module, score }
router.post('/complete', async (req, res) => {
  const { volunteer_id, module, score } = req.body || {};
  if (!volunteer_id || !module) return res.status(400).json({ error: 'volunteer_id + module required' });
  try {
    await db.query(`UPDATE volunteer_trainings SET status = 'completed', score = $1, completed_at = NOW() WHERE volunteer_id = $2 AND module = $3`, [Number(score) || null, volunteer_id, module]);
  } catch {}
  return res.json({ volunteer_id, module, status: 'completed', certified: Number(score || 0) >= 80 });
});

module.exports = router;
