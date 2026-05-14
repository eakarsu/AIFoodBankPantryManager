// Donor experience: personalised thank-yous, impact reports.
const router = require('express').Router();
const db = require('../db');
const { callOpenRouter } = require('../openrouter');
const { aiRateLimiter } = require('../middleware/rateLimiter');

// POST /api/donor-experience/thank-you { donor_id, amount_usd, message_tone?:'warm' }
router.post('/thank-you', aiRateLimiter, async (req, res) => {
  try {
    const { donor_id, amount_usd, message_tone = 'warm' } = req.body || {};
    if (!donor_id || !amount_usd) return res.status(400).json({ error: 'donor_id + amount_usd required' });
    const families_fed = Math.round(Number(amount_usd) / 25);
    let donor = null;
    try { donor = (await db.query(`SELECT name FROM donors WHERE id = $1`, [donor_id])).rows[0]; } catch {}
    if (!process.env.OPENROUTER_API_KEY) return res.json({ donor_id, families_fed, message: `Thank you ${donor?.name || 'donor'}! Your $${amount_usd} donation will feed approximately ${families_fed} families this month.` });
    try {
      const raw = await callOpenRouter([
        { role: 'system', content: `Write a ${message_tone} thank-you message (≤120 words) for a donor.` },
        { role: 'user', content: `Donor: ${donor?.name || 'Friend'}\nAmount: $${amount_usd}\nFamilies fed: ${families_fed}` },
      ]);
      return res.json({ donor_id, families_fed, message: raw });
    } catch (e) {
      return res.status(503).json({ error: 'LLM unavailable' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'thank-you failed' });
  }
});

module.exports = router;
