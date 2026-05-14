const router = require('express').Router();
const db = require('../db');
const { callOpenRouter } = require('../openrouter');

// ─── GET /api/analytics/expiration-risk ──────────────────────────────────────
// Returns inventory items grouped by risk level (high/medium/low/critical/expired)
// with per-group counts and weights, plus an AI-generated executive summary.
//
// Risk tiers (matching the AI route logic):
//   EXPIRED  — past expiration date
//   CRITICAL — ≤ 3 days remaining
//   HIGH     — ≤ 7 days remaining
//   MEDIUM   — ≤ 14 days remaining
//   LOW      — ≤ 30 days remaining
//   OK       — > 30 days remaining
router.get('/expiration-risk', async (req, res) => {
  try {
    // 1. Aggregate counts and weights grouped by risk level
    const aggregateResult = await db.query(`
      SELECT
        risk_level,
        COUNT(*) AS item_count,
        COALESCE(SUM(weight_lbs), 0) AS total_weight_lbs,
        COALESCE(SUM(quantity), 0) AS total_quantity
      FROM (
        SELECT
          weight_lbs,
          quantity,
          CASE
            WHEN expiration_date <= CURRENT_DATE                      THEN 'EXPIRED'
            WHEN expiration_date <= CURRENT_DATE + INTERVAL '3 days'  THEN 'CRITICAL'
            WHEN expiration_date <= CURRENT_DATE + INTERVAL '7 days'  THEN 'HIGH'
            WHEN expiration_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'MEDIUM'
            WHEN expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'LOW'
            ELSE 'OK'
          END AS risk_level
        FROM inventory
        WHERE status = 'available' AND expiration_date IS NOT NULL
      ) sub
      GROUP BY risk_level
      ORDER BY
        CASE risk_level
          WHEN 'EXPIRED'  THEN 1
          WHEN 'CRITICAL' THEN 2
          WHEN 'HIGH'     THEN 3
          WHEN 'MEDIUM'   THEN 4
          WHEN 'LOW'      THEN 5
          ELSE 6
        END
    `);

    // 2. Fetch representative items per risk level (top 5 each, ordered by expiry)
    const itemsResult = await db.query(`
      SELECT
        name, category, quantity, unit, weight_lbs, expiration_date,
        CASE
          WHEN expiration_date <= CURRENT_DATE                      THEN 'EXPIRED'
          WHEN expiration_date <= CURRENT_DATE + INTERVAL '3 days'  THEN 'CRITICAL'
          WHEN expiration_date <= CURRENT_DATE + INTERVAL '7 days'  THEN 'HIGH'
          WHEN expiration_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'MEDIUM'
          WHEN expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'LOW'
          ELSE 'OK'
        END AS risk_level
      FROM inventory
      WHERE status = 'available' AND expiration_date IS NOT NULL
      ORDER BY expiration_date ASC
      LIMIT 100
    `);

    // Group items by risk level for the response
    const RISK_ORDER = ['EXPIRED', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'OK'];
    const itemsByRisk = {};
    for (const level of RISK_ORDER) {
      itemsByRisk[level] = [];
    }
    for (const row of itemsResult.rows) {
      if (itemsByRisk[row.risk_level]) {
        itemsByRisk[row.risk_level].push(row);
      }
    }

    // Build summary stats
    const summary = {};
    for (const row of aggregateResult.rows) {
      summary[row.risk_level] = {
        item_count: parseInt(row.item_count),
        total_weight_lbs: parseFloat(row.total_weight_lbs),
        total_quantity: parseInt(row.total_quantity),
      };
    }

    // Ensure all risk levels appear (with zeros if absent)
    for (const level of RISK_ORDER) {
      if (!summary[level]) {
        summary[level] = { item_count: 0, total_weight_lbs: 0, total_quantity: 0 };
      }
    }

    // 3. Generate AI executive summary (only when there are at-risk items)
    let ai_summary = null;
    const atRiskCount =
      (summary.EXPIRED?.item_count || 0) +
      (summary.CRITICAL?.item_count || 0) +
      (summary.HIGH?.item_count || 0);

    if (atRiskCount > 0) {
      const messages = [
        {
          role: 'system',
          content: `You are a food safety analyst for a food bank. Provide concise, actionable executive summaries about expiration risk. Be direct and prioritize urgency.`
        },
        {
          role: 'user',
          content: `Provide a 3-sentence executive summary of our expiration risk situation:

Risk Level Summary:
${RISK_ORDER.map(level => `- ${level}: ${summary[level].item_count} items (${summary[level].total_weight_lbs.toFixed(1)} lbs)`).join('\n')}

Top urgent items:
${itemsResult.rows.slice(0, 10).map(i => `- [${i.risk_level}] ${i.name}: ${i.quantity} ${i.unit || 'units'}, expires ${i.expiration_date}`).join('\n')}

Include: immediate actions needed, estimated waste risk in lbs, and one redistribution recommendation.`
        }
      ];

      try {
        ai_summary = await callOpenRouter(messages, { maxTokens: 400 });
      } catch (aiErr) {
        // Non-fatal — dashboard still returns structured data even if AI fails
        console.error('AI summary failed:', aiErr.message);
        ai_summary = null;
      }
    }

    res.json({
      generated_at: new Date().toISOString(),
      summary,
      items_by_risk: itemsByRisk,
      ai_summary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
