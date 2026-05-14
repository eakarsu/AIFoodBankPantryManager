# Audit Apply Notes — AIFoodBankPantryManager

Audit source: `_AUDIT/reports/batch_03.md` (#35). Audit verdict: template-clone, 0 AI endpoints.

## Reality check

Audit is stale. `backend/routes/ai.js` already has 9 AI endpoints: `/donation-appeal`, `/volunteer-optimization`, `/nutritional-analysis`, `/expiration-risk`, `/grant-assistant`, `/community-assessment`, `/food-package-builder`, `/donor-retention`, `/delivery-route`.

So `/route-optimize`, `/donor-engage`, `/volunteer-schedule` are effectively present.

## Implementations applied

Added three endpoints to `backend/routes/ai.js`:

1. `POST /api/ai/inventory-forecast` — pulls inventory + recent distributions; returns shortfall by category, expiring items, procurement priorities.
2. `POST /api/ai/distribution-optimize` — pulls available inventory + clients; AI returns per-client allocations, leftovers, fairness score.
3. `POST /api/ai/fraud-detect` — local heuristics for shared phone / shared address+lastname, then AI judges each flag. Sensitivity-aware prompt.

All match existing `callOpenRouter`, `persistAIResult`, `aiRateLimiter`, `requireAuth` patterns. DB queries are `.catch`-wrapped to be schema-tolerant. Syntax-checked.

## Backlog (prioritized)

### Mechanical
- `/need-predict` — proactive client outreach (nice complement to inventory forecast).
- Donor + grant CRM endpoints already partially present; surface in dashboard.

### Needs creds / external
- Eligibility verification integrations (state SNAP/WIC).
- Food safety tracking (temperature/expiration sensors).
- Mobile self-service app for clients.

### Needs product decision
- Volunteer training / certification curricula.
- Annual report / impact metrics templates.

### Custom features
- Real-time inventory dashboard.
- Donor experience: personalized impact reports.
- Supply chain transparency / food miles.

## Apply pass 3 (frontend)

FE already wired. `frontend/src/pages/AITools.jsx` covers the original 9 AI endpoints via an endpoint map; `pages/AIAdvancedTools.jsx` calls the three apply2-added endpoints (`/ai/inventory-forecast`, `/ai/distribution-optimize`, `/ai/fraud-detect`); `pages/AIHistory.jsx` reads history. No changes needed.

## Apply pass 4 (mechanical backlog)

Added the one remaining MECHANICAL backlog item (`/need-predict`).

**Backend** (`backend/routes/ai.js`):
- Added `AIKeyMissingError` + `callOpenRouterStrict` wrapper so the new endpoint returns 503 (not 500) when `OPENROUTER_API_KEY` is unset.
- New `POST /api/ai/need-predict` — accepts `{ horizon_days?, focus_segment?, notes? }`. Pulls clients + 120-day visit aggregates and asks the model to predict at-risk / lapsing clients with suggested outreach channel + message. Persists via existing `persistAIResult`. Reuses `aiRateLimiter`, `requireAuth`, `db.query`. JSON-parsed when possible.

**Frontend** (`frontend/src/pages/AIAdvancedTools.jsx`):
- Added a fourth tool entry (`Proactive Need Prediction`) to the existing `tools` array. Reuses the existing dynamic form, JWT bearer (via `api.post`), error display, and lucide icon styling. No route or layout changes needed (`/ai-advanced-tools` was already wired in pass 3).

Skipped Mechanical sub-item "Donor + grant CRM endpoints already partially present; surface in dashboard" (dashboard surface is presentation-only — not a new endpoint), and all Needs-Creds/Product-Decision/Custom items.

Smoke tested: started backend on :4017, cleared `OPENROUTER_API_KEY` post-boot, logged in (admin@foodbank.org), `POST /api/ai/need-predict` returned **HTTP 503** with `"AI not configured: OPENROUTER_API_KEY is missing"`. JWT auth path verified end-to-end.
