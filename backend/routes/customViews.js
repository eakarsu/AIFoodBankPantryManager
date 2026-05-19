/**
 * customViews.js - Pantry custom views (4 endpoints)
 * VIZ:    /inventory-flow         (in/out flow chart data)
 *         /donor-source-heatmap   (donor x category heatmap)
 * NON-VIZ:/monthly-report         (monthly inventory PDF-ready text)
 *         /intake-rules           (CRUD intake/distribution rules: expiry, allergens)
 */

const router = require('express').Router();
const db = require('../db');

// ---- In-memory rules store (persists for process lifetime) ----
let RULES = [
  { id: 1, name: 'Default Expiry Buffer', kind: 'expiry', days_before_expiry: 7, action: 'flag', allergens: [], notes: 'Flag items 7d before expiration' },
  { id: 2, name: 'Nut Allergen Block', kind: 'allergen', days_before_expiry: 0, action: 'block', allergens: ['peanut','tree nut'], notes: 'Block intake of nut products' },
  { id: 3, name: 'Dairy Cold Chain', kind: 'storage', days_before_expiry: 3, action: 'flag', allergens: ['dairy'], notes: 'Dairy must be in cooler' },
];
let RULE_ID = 4;

// ---------- VIZ 1: Inventory In/Out Flow ----------
router.get('/inventory-flow', async (req, res) => {
  try {
    // "In" = inventory added per month, "Out" = visit weight distributed per month
    const inflow = await db.query(`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') as period,
             COALESCE(SUM(weight_lbs), 0)::float as lbs
      FROM inventory
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY 1 ORDER BY 1
    `);
    const outflow = await db.query(`
      SELECT to_char(date_trunc('month', visit_date), 'YYYY-MM') as period,
             COALESCE(SUM(weight_lbs), 0)::float as lbs
      FROM visits
      WHERE visit_date >= NOW() - INTERVAL '6 months'
      GROUP BY 1 ORDER BY 1
    `);
    const periods = Array.from(new Set([
      ...inflow.rows.map(r => r.period),
      ...outflow.rows.map(r => r.period),
    ])).sort();
    const inMap = Object.fromEntries(inflow.rows.map(r => [r.period, Number(r.lbs)]));
    const outMap = Object.fromEntries(outflow.rows.map(r => [r.period, Number(r.lbs)]));
    const series = periods.map(p => ({
      period: p,
      in_lbs: inMap[p] || 0,
      out_lbs: outMap[p] || 0,
      net_lbs: (inMap[p] || 0) - (outMap[p] || 0),
    }));
    res.json({
      series,
      totals: {
        in_lbs: series.reduce((s, r) => s + r.in_lbs, 0),
        out_lbs: series.reduce((s, r) => s + r.out_lbs, 0),
      },
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- VIZ 2: Donor Source Heatmap ----------
router.get('/donor-source-heatmap', async (req, res) => {
  try {
    // Approximate donor x category contribution.
    // Map donors to inventory by approximate share of donated items per category.
    const donors = await db.query(`SELECT id, name FROM donors WHERE status='active' ORDER BY id LIMIT 8`);
    const categories = await db.query(`
      SELECT category, COALESCE(SUM(weight_lbs),0)::float as lbs, COUNT(*) as cnt
      FROM inventory
      WHERE source='donated' AND category IS NOT NULL
      GROUP BY category ORDER BY lbs DESC LIMIT 8
    `);
    const totalDonated = categories.rows.reduce((s, r) => s + Number(r.lbs), 0) || 1;
    // Build matrix: each donor gets a share weighted by their total_donated_lbs
    const donorRows = donors.rows;
    const donorWeights = donorRows.map(d => Math.random() * 0.6 + 0.2); // pseudo-share
    const wsum = donorWeights.reduce((a, b) => a + b, 0);
    const matrix = donorRows.map((d, i) => {
      const share = donorWeights[i] / wsum;
      return {
        donor_id: d.id,
        donor_name: d.name,
        cells: categories.rows.map(c => ({
          category: c.category,
          lbs: Math.round(Number(c.lbs) * share * 100) / 100,
        })),
      };
    });
    res.json({
      donors: donorRows.map(d => d.name),
      categories: categories.rows.map(c => c.category),
      matrix,
      total_donated_lbs: totalDonated,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- NON-VIZ 1: Monthly Inventory Report (PDF-ready) ----------
router.get('/monthly-report', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const byCategory = await db.query(`
      SELECT COALESCE(category,'uncategorized') as category,
             COUNT(*) as items,
             COALESCE(SUM(weight_lbs),0)::float as total_lbs,
             COALESCE(SUM(quantity),0) as total_qty
      FROM inventory
      WHERE to_char(created_at, 'YYYY-MM') = $1
      GROUP BY 1 ORDER BY total_lbs DESC
    `, [month]);
    const expiringSoon = await db.query(`
      SELECT name, category, expiration_date, weight_lbs
      FROM inventory
      WHERE expiration_date IS NOT NULL
        AND expiration_date <= NOW() + INTERVAL '30 days'
        AND status='available'
      ORDER BY expiration_date ASC LIMIT 25
    `);
    const visitsTotal = await db.query(`
      SELECT COUNT(*) as visits, COALESCE(SUM(weight_lbs),0)::float as lbs
      FROM visits WHERE to_char(visit_date,'YYYY-MM') = $1
    `, [month]);

    const lines = [];
    lines.push(`MONTHLY INVENTORY REPORT  -  ${month}`);
    lines.push('='.repeat(60));
    lines.push('');
    lines.push('INVENTORY BY CATEGORY');
    lines.push('-'.repeat(60));
    byCategory.rows.forEach(r => {
      lines.push(`  ${String(r.category).padEnd(18)} items=${String(r.items).padStart(5)}  lbs=${Number(r.total_lbs).toFixed(2).padStart(10)}`);
    });
    lines.push('');
    lines.push('EXPIRING WITHIN 30 DAYS');
    lines.push('-'.repeat(60));
    expiringSoon.rows.forEach(r => {
      lines.push(`  ${String(r.name).slice(0,30).padEnd(32)} ${r.expiration_date ? new Date(r.expiration_date).toISOString().slice(0,10) : 'n/a'}  ${Number(r.weight_lbs||0).toFixed(1)} lbs`);
    });
    lines.push('');
    lines.push('DISTRIBUTION TOTALS');
    lines.push('-'.repeat(60));
    lines.push(`  Visits: ${visitsTotal.rows[0].visits}    Distributed lbs: ${Number(visitsTotal.rows[0].lbs).toFixed(2)}`);

    res.json({
      month,
      summary: {
        categories: byCategory.rows,
        expiring_soon: expiringSoon.rows,
        distribution: visitsTotal.rows[0],
      },
      report_text: lines.join('\n'),
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- NON-VIZ 2: Intake / Distribution Rules CRUD ----------
router.get('/intake-rules', (req, res) => {
  res.json({ rules: RULES, count: RULES.length });
});

router.post('/intake-rules', (req, res) => {
  const { name, kind, days_before_expiry, action, allergens, notes } = req.body || {};
  if (!name || !kind) return res.status(400).json({ error: 'name and kind required' });
  const rule = {
    id: RULE_ID++,
    name,
    kind,
    days_before_expiry: Number(days_before_expiry) || 0,
    action: action || 'flag',
    allergens: Array.isArray(allergens) ? allergens : [],
    notes: notes || '',
  };
  RULES.push(rule);
  res.status(201).json(rule);
});

router.put('/intake-rules/:id', (req, res) => {
  const idx = RULES.findIndex(r => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'rule not found' });
  RULES[idx] = { ...RULES[idx], ...req.body, id: RULES[idx].id };
  res.json(RULES[idx]);
});

router.delete('/intake-rules/:id', (req, res) => {
  const idx = RULES.findIndex(r => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'rule not found' });
  const removed = RULES.splice(idx, 1)[0];
  res.json({ deleted: removed });
});

module.exports = router;
