// ============================================================
// === Batch 03 Gaps & Frontend Mounts ===
// Auto-generated Gap-feature endpoints (lean v0).
// TODO: configure credentials (set OPENROUTER_API_KEY).
// ============================================================
const express = require('express');
const router = express.Router();

let _gfReady = false;
async function ensureGapTable(pool) {
  if (_gfReady || !pool) return;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS gap_features (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(120) NOT NULL,
      user_id INT,
      input JSONB,
      output JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    _gfReady = true;
  } catch (_) { /* tolerant of missing DB */ }
}

async function callAI(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { ok: false, status: 503, error: 'AI service unavailable. Set OPENROUTER_API_KEY (TODO: configure credentials).' };
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
    });
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return { ok: r.ok, status: r.status, text, raw: data };
  } catch (e) {
    return { ok: false, status: 500, error: String(e.message || e) };
  }
}

function buildHandler(slug, label, hint) {
  return async (req, res) => {
    const body = req.body || {};
    const userId = req.user?.id || null;
    const prompt = `Feature: ${label}\nContext hint: ${hint}\nUser input:\n${JSON.stringify(body, null, 2)}\n\nProduce a concise, actionable response.`;
    const ai = await callAI(prompt);
    try {
      const pool = req.app.locals.pool || req.app.get('pool') || null;
      if (pool) {
        await ensureGapTable(pool);
        await pool.query('INSERT INTO gap_features(slug, user_id, input, output) VALUES ($1,$2,$3,$4)',
          [slug, userId, body, { text: ai.text || ai.error || null }]);
      }
    } catch (_) { /* tolerant */ }
    if (!ai.ok) return res.status(ai.status || 500).json({ error: ai.error || ai.text || `Upstream error (${ai.status})`, slug });
    res.json({ slug, label, result: ai.text });
  };
}

router.post('/gap-active-ai-surface-concentrated-in-single-ai-js-broad-endpo', buildHandler('gap-ai-active-ai-surface-concentrated-in-single-ai-js-broad-endpo', 'Active AI surface concentrated in single ai.js — broad endpo', 'Active AI surface concentrated in single ai.js — broad endpoints (distribution-optimise, inventory-forecast, route-optimise, donor-engage, need-predict, volunteer-schedule, fraud-detect) are mostly *i'));
router.post('/gap-no-vision-model-for-food-quality-shelf-life-assessment', buildHandler('gap-ai-no-vision-model-for-food-quality-shelf-life-assessment', 'No vision-model for food-quality / shelf-life assessment', 'No vision-model for food-quality / shelf-life assessment'));
router.post('/gap-no-conversational-client-intake-agent', buildHandler('gap-ai-no-conversational-client-intake-agent', 'No conversational client-intake agent', 'No conversational client-intake agent'));
router.post('/gap-limited-food-safety-expiration-alerting', buildHandler('gap-non-limited-food-safety-expiration-alerting', 'Limited food-safety / expiration alerting', 'Limited food-safety / expiration alerting'));
router.post('/gap-no-formal-annual-report-templating-beyond-raw-data-export', buildHandler('gap-non-no-formal-annual-report-templating-beyond-raw-data-export', 'No formal annual-report templating beyond raw data export', 'No formal annual-report templating beyond raw data export'));
router.post('/gap-no-sms-voice-channel-for-low-literacy-clients', buildHandler('gap-non-no-sms-voice-channel-for-low-literacy-clients', 'No SMS/voice channel for low-literacy clients', 'No SMS/voice channel for low-literacy clients'));
router.post('/gap-no-external-payment-rail-for-cash-assistance', buildHandler('gap-non-no-external-payment-rail-for-cash-assistance', 'No external payment-rail for cash assistance', 'No external payment-rail for cash assistance'));

module.exports = router;
