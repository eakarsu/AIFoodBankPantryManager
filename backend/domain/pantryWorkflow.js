'use strict';

const PROHIBITED_RECIPIENT_FIELDS = ['ssn', 'socialSecurityNumber', 'fullDateOfBirth', 'medicalRecord'];

function evaluatePantryWorkflow(input = {}) {
  const errors = [];
  const lots = Array.isArray(input.lots) ? input.lots : [];
  const reservations = Array.isArray(input.reservations) ? input.reservations : [];
  if (!lots.length) errors.push('lots is required');
  const lotIds = new Set();
  const now = Date.parse(input.asOf || new Date().toISOString());
  const lotState = lots.map((lot) => {
    if (!lot.id || lotIds.has(String(lot.id))) errors.push('lot ids must be unique and non-empty');
    lotIds.add(String(lot.id));
    if (!lot.sku || !lot.donorRef || !lot.receivedAt || !lot.expiresAt) errors.push(`lot ${lot.id || '?'} lacks chain-of-custody fields`);
    const onHand = Number(lot.onHand);
    const reserved = Number(lot.reserved || 0);
    if (!Number.isInteger(onHand) || onHand < 0 || !Number.isInteger(reserved) || reserved < 0 || reserved > onHand) errors.push(`lot ${lot.id || '?'} has invalid counts`);
    return { ...lot, onHand, reserved, available: onHand - reserved, expired: Date.parse(lot.expiresAt) <= now };
  });
  for (const reservation of reservations) {
    const recipient = reservation.recipient || {};
    if (PROHIBITED_RECIPIENT_FIELDS.some((field) => recipient[field])) errors.push(`reservation ${reservation.id || '?'} contains prohibited recipient data`);
    if (!reservation.eligibilityRef) errors.push(`reservation ${reservation.id || '?'} requires eligibilityRef`);
  }
  const recalls = new Set((input.recalls || []).map((recall) => String(recall.lotId)));
  const recallImpact = lotState.filter((lot) => recalls.has(String(lot.id))).map((lot) => ({ lotId: lot.id, quarantinedUnits: lot.onHand }));
  const allocation = [];
  const mutable = lotState.map((lot) => ({ ...lot })).sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt));
  for (const reservation of reservations) {
    let remaining = Number(reservation.quantity || 0);
    if (!Number.isInteger(remaining) || remaining <= 0) { errors.push(`reservation ${reservation.id || '?'} quantity must be a positive integer`); continue; }
    for (const lot of mutable.filter((candidate) => candidate.sku === reservation.sku && !candidate.expired && !recalls.has(String(candidate.id)))) {
      const take = Math.min(remaining, Math.max(0, lot.available));
      if (take) allocation.push({ reservationId: reservation.id, lotId: lot.id, quantity: take });
      lot.available -= take;
      remaining -= take;
      if (!remaining) break;
    }
    if (remaining) allocation.push({ reservationId: reservation.id, shortage: remaining });
  }
  return {
    errors,
    result: {
      allocation,
      recallImpact,
      expiredLots: lotState.filter((lot) => lot.expired).map((lot) => lot.id),
      reconciliation: lotState.map((lot) => ({ lotId: lot.id, onHand: lot.onHand, reserved: lot.reserved, available: lot.available })),
      decision: !errors.length && allocation.every((entry) => !entry.shortage) ? 'reviewable' : 'revise'
    },
    assumptions: ['FEFO allocation is used', 'eligibilityRef points to an access-controlled source record'],
    uncertainty: { offlineConflictsRequireSyncReview: true, recallReleaseRequiresSupervisor: true }
  };
}

module.exports = { evaluatePantryWorkflow, PROHIBITED_RECIPIENT_FIELDS };
