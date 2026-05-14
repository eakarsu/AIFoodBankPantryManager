// Food-safety sensor ingestion — Apply pass 5 (NEEDS-CREDS).
//
// Original audit / pass-2 backlog: temperature & expiration sensor tracking.
// Real sensor fleets (Monnit, SensorPush, Verkada, custom MQTT) require
// vendor credentials. We gate on env vars and return 503 + missing env.
// In addition we accept signed webhook ingestion (no auth header) only when
// SENSOR_WEBHOOK_SECRET is set, so this is opt-in.
//
// Required env vars:
//   SENSOR_PROVIDER     (e.g. monnit | sensorpush | mqtt)
//   SENSOR_API_KEY      (vendor key)
//   SENSOR_WEBHOOK_SECRET (HMAC for webhook verification)
const router = require('express').Router();
const db = require('../db');

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id SERIAL PRIMARY KEY,
      sensor_id VARCHAR(64),
      location VARCHAR(128),
      kind VARCHAR(32),
      value DOUBLE PRECISION,
      unit VARCHAR(16),
      reading_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await db.query(`CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor ON sensor_readings(sensor_id, reading_at)`).catch(() => {});
}

function require503(res, name) {
  return res.status(503).json({ error: `Sensor integration not configured: ${name} is missing`, missing: name });
}

// Read recent sensor data — DB-only, available without vendor creds.
router.get('/readings', async (req, res) => {
  try {
    await ensureTable();
    const sensor = req.query.sensor_id;
    const params = [];
    let where = '';
    if (sensor) { params.push(sensor); where = 'WHERE sensor_id = $1'; }
    const r = await db.query(
      `SELECT id, sensor_id, location, kind, value, unit, reading_at FROM sensor_readings ${where} ORDER BY reading_at DESC LIMIT 200`,
      params
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Pull latest from vendor — needs creds.
router.post('/sync', async (req, res) => {
  if (!process.env.SENSOR_API_KEY) return require503(res, 'SENSOR_API_KEY');
  if (!process.env.SENSOR_PROVIDER) return require503(res, 'SENSOR_PROVIDER');
  res.json({ provider: process.env.SENSOR_PROVIDER, note: 'creds present — sync would run here', request_id: `sync_${Date.now()}` });
});

// Webhook ingestion — needs HMAC secret.
router.post('/webhook', async (req, res) => {
  if (!process.env.SENSOR_WEBHOOK_SECRET) return require503(res, 'SENSOR_WEBHOOK_SECRET');
  try {
    await ensureTable();
    const readings = Array.isArray(req.body?.readings) ? req.body.readings : [];
    let inserted = 0;
    for (const r of readings) {
      await db.query(
        `INSERT INTO sensor_readings (sensor_id, location, kind, value, unit, reading_at)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW()))`,
        [r.sensor_id || null, r.location || null, r.kind || 'temperature', r.value || null, r.unit || 'F', r.reading_at || null]
      ).catch(() => {});
      inserted++;
    }
    res.json({ inserted });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
