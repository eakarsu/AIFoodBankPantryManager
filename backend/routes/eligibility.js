// Eligibility verification — Apply pass 5 (NEEDS-CREDS).
//
// Original audit / pass-2 backlog: SNAP / WIC / state benefit eligibility
// integrations. These require state-by-state vendor credentials; we gate on
// env vars and return HTTP 503 + `{ missing: '<ENV>' }` when unset.
//
// Required env vars:
//   SNAP/WIC: SNAP_API_BASE, SNAP_API_KEY  (USDA / state interface)
//             WIC_API_BASE,  WIC_API_KEY
//   Generic:  BENEFITS_HUB_KEY  (multi-state aggregator alternative)
const router = require('express').Router();

function require503(res, name) {
  return res.status(503).json({ error: `Eligibility integration not configured: ${name} is missing`, missing: name });
}

router.post('/snap/check', async (req, res) => {
  if (!process.env.SNAP_API_KEY) return require503(res, 'SNAP_API_KEY');
  if (!process.env.SNAP_API_BASE) return require503(res, 'SNAP_API_BASE');
  const { client_id, household_size, monthly_income } = req.body || {};
  if (!client_id) return res.status(400).json({ error: 'client_id required' });
  // Stub: with creds present we'd POST to SNAP_API_BASE/eligibility.
  res.json({
    program: 'SNAP',
    client_id,
    household_size: household_size || null,
    monthly_income: monthly_income || null,
    note: 'creds present — eligibility check would be dispatched here',
    request_id: `snap_${Date.now()}`,
  });
});

router.post('/wic/check', async (req, res) => {
  if (!process.env.WIC_API_KEY) return require503(res, 'WIC_API_KEY');
  if (!process.env.WIC_API_BASE) return require503(res, 'WIC_API_BASE');
  const { client_id } = req.body || {};
  if (!client_id) return res.status(400).json({ error: 'client_id required' });
  res.json({ program: 'WIC', client_id, note: 'creds present — request would be dispatched', request_id: `wic_${Date.now()}` });
});

router.post('/benefits-hub/check', async (req, res) => {
  if (!process.env.BENEFITS_HUB_KEY) return require503(res, 'BENEFITS_HUB_KEY');
  res.json({ provider: 'benefits-hub', note: 'creds present — request would be dispatched', request_id: `bh_${Date.now()}` });
});

module.exports = router;
