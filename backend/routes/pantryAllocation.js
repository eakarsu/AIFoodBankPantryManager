const express = require('express');
const router = express.Router();

router.post('/plan', (req, res) => {
  const body = req.body || {};
  const households = Number(body.households || 0);
  const produce = Number(body.produce_lbs || 0);
  const protein = Number(body.protein_lbs || 0);
  const shelf = Number(body.shelf_stable_lbs || 0);
  const homebound = Number(body.homebound_clients || 0);
  const lbsPerHousehold = (produce + protein + shelf) / Math.max(households, 1);
  const risk = lbsPerHousehold < 18 || protein / Math.max(households, 1) < 4 ? 'shortfall' : homebound > households * 0.25 ? 'delivery constrained' : 'ready';
  res.json({
    distribution: body.distribution || 'distribution',
    lbs_per_household: Number(lbsPerHousehold.toFixed(1)),
    readiness_band: risk,
    allocation: {
      produce_lbs_each: Number((produce / Math.max(households, 1)).toFixed(1)),
      protein_lbs_each: Number((protein / Math.max(households, 1)).toFixed(1)),
      shelf_stable_lbs_each: Number((shelf / Math.max(households, 1)).toFixed(1)),
    },
    actions: [
      risk === 'shortfall' ? 'Request emergency protein or shelf-stable transfer.' : 'Inventory supports planned household count.',
      homebound > 0 ? 'Reserve delivery slots for homebound clients before walk-up allocation.' : 'No homebound delivery reserve required.',
    ],
    generated_at: new Date().toISOString(),
  });
});

module.exports = router;
