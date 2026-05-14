// Agentic food bank director: "limited inventory, distribute optimally".
const router = require('express').Router();
const db = require('../db');
const { callOpenRouter } = require('../openrouter');
const { aiRateLimiter } = require('../middleware/rateLimiter');

// POST /api/agentic-director/allocate { clients_count, inventory:[{item,qty}] }
router.post('/allocate', aiRateLimiter, async (req, res) => {
  try {
    const { clients_count, inventory = [] } = req.body || {};
    if (!clients_count || !Array.isArray(inventory) || !inventory.length) return res.status(400).json({ error: 'clients_count + inventory[] required' });
    // TODO: configure credentials — OPENROUTER_API_KEY
    if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: 'OPENROUTER_API_KEY missing' });
    const system = 'You are a food bank director optimising allocation. Output JSON {"per_family":[{"item":"...","qty":int}],"reserve":[{"item":"...","qty":int}],"rationale":"..."}.';
    let parsed;
    try {
      const raw = await callOpenRouter([{ role: 'system', content: system }, { role: 'user', content: JSON.stringify({ clients_count, inventory }) }]);
      try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw); } catch { parsed = { raw }; }
    } catch (e) {
      return res.status(503).json({ error: 'LLM unavailable' });
    }
    return res.json({ clients_count, allocation: parsed });
  } catch (e) {
    return res.status(500).json({ error: 'allocate failed' });
  }
});

module.exports = router;
