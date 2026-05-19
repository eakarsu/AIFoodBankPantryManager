// Mobile self-service portal endpoints — Apply pass 5 (NEEDS-CREDS).
//
// Original audit / pass-2 backlog: "Mobile self-service app for clients".
// We add the API surface a mobile app would consume; push notifications go
// through Firebase Cloud Messaging — gated on FCM_SERVER_KEY.
//
// Required env vars:
//   FCM_SERVER_KEY  (push notifications)
//   MAGIC_LINK_SECRET  (for SMS magic-link auth flow)
//
// Endpoints:
//   GET  /api/mobile-portal/me              → current user profile (no creds)
//   POST /api/mobile-portal/check-in        → record a self-reported visit (DB)
//   POST /api/mobile-portal/push-register   → 503 unless FCM_SERVER_KEY set
//   POST /api/mobile-portal/magic-link      → 503 unless MAGIC_LINK_SECRET set
const router = require('express').Router();
const db = require('../db');

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS mobile_check_ins (
      id SERIAL PRIMARY KEY,
      client_id INTEGER,
      message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await db.query(`
    CREATE TABLE IF NOT EXISTS push_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      token TEXT NOT NULL,
      platform VARCHAR(16),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
}

function require503(res, name) {
  return res.status(503).json({ error: `Mobile portal not configured: ${name} is missing`, missing: name });
}

router.get('/me', (req, res) => {
  res.json({ user: req.user || null });
});

router.post('/check-in', async (req, res) => {
  try {
    await ensureTable();
    const { client_id, message } = req.body || {};
    const r = await db.query(
      `INSERT INTO mobile_check_ins (client_id, message) VALUES ($1, $2) RETURNING id, created_at`,
      [client_id || null, message || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/push-register', async (req, res) => {
  if (!process.env.FCM_SERVER_KEY) return require503(res, 'FCM_SERVER_KEY');
  try {
    await ensureTable();
    const { token, platform } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token required' });
    const r = await db.query(
      `INSERT INTO push_tokens (user_id, token, platform) VALUES ($1, $2, $3) RETURNING id`,
      [req.user?.id || null, token, platform || 'unknown']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/magic-link', async (req, res) => {
  if (!process.env.MAGIC_LINK_SECRET) return require503(res, 'MAGIC_LINK_SECRET');
  res.json({ note: 'creds present — magic-link generation would run here', request_id: `ml_${Date.now()}` });
});

module.exports = router;
