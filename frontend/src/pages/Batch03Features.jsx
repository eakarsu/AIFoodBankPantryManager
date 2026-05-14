// === Batch 03 Gaps & Frontend Mounts ===
// Auto-generated frontend page (lean v0). Wires Custom Feature Suggestions
// and Gap endpoints (AI counterparts + non-AI features) to backend routes.
import React, { useState } from 'react';

const API_BASE = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) || 'http://localhost:4000/api';

const FEATURES = [
  { kind: 'cfs', slug: 'cf-agentic-food-bank-director', label: 'Agentic food bank director', desc: '"We have 500 clients, limited inventory, how to distribute?" → agent optimizes allocations based on need', endpoint: '/cf-agentic-food-bank-director' },
  { kind: 'cfs', slug: 'cf-real-time-inventory', label: 'Real-time inventory', desc: 'Track food shelf-life, auto-flag expiring items, suggest distributions', endpoint: '/cf-real-time-inventory' },
  { kind: 'cfs', slug: 'cf-donor-experience', label: 'Donor experience', desc: 'Personalized thank-yous, impact reports ("Your donation fed 10 families")', endpoint: '/cf-donor-experience' },
  { kind: 'cfs', slug: 'cf-community-needs-assessment', label: 'Community needs assessment', desc: 'Survey clients, identify specific needs (formula, gluten-free, kosher)', endpoint: '/cf-community-needs-assessment' },
  { kind: 'cfs', slug: 'cf-volunteer-training', label: 'Volunteer training', desc: 'Onboarding, certification, skill tracking', endpoint: '/cf-volunteer-training' },
  { kind: 'cfs', slug: 'cf-supply-chain-transparency', label: 'Supply chain transparency', desc: 'Know where food comes from, food miles, sustainability', endpoint: '/cf-supply-chain-transparency' },
  { kind: 'cfs', slug: 'cf-mobile-app-for-clients', label: 'Mobile app for clients', desc: 'Self-service food pantry reservations, pickup scheduling', endpoint: '/cf-mobile-app-for-clients' },
  { kind: 'gap-ai', slug: 'gap-ai-active-ai-surface-concentrated-in-single-ai-js-broad-endpo', label: 'Active AI surface concentrated in single ai.js — broad endpo', desc: 'Active AI surface concentrated in single ai.js — broad endpoints (distribution-optimise, inventory-forecast, route-optimise, donor-engage, need-predict, volunteer-schedule, fraud-detect) are mostly *i', endpoint: '/gap-active-ai-surface-concentrated-in-single-ai-js-broad-endpo' },
  { kind: 'gap-ai', slug: 'gap-ai-no-vision-model-for-food-quality-shelf-life-assessment', label: 'No vision-model for food-quality / shelf-life assessment', desc: 'No vision-model for food-quality / shelf-life assessment', endpoint: '/gap-no-vision-model-for-food-quality-shelf-life-assessment' },
  { kind: 'gap-ai', slug: 'gap-ai-no-conversational-client-intake-agent', label: 'No conversational client-intake agent', desc: 'No conversational client-intake agent', endpoint: '/gap-no-conversational-client-intake-agent' },
  { kind: 'gap-non', slug: 'gap-non-limited-food-safety-expiration-alerting', label: 'Limited food-safety / expiration alerting', desc: 'Limited food-safety / expiration alerting', endpoint: '/gap-limited-food-safety-expiration-alerting' },
  { kind: 'gap-non', slug: 'gap-non-no-formal-annual-report-templating-beyond-raw-data-export', label: 'No formal annual-report templating beyond raw data export', desc: 'No formal annual-report templating beyond raw data export', endpoint: '/gap-no-formal-annual-report-templating-beyond-raw-data-export' },
  { kind: 'gap-non', slug: 'gap-non-no-sms-voice-channel-for-low-literacy-clients', label: 'No SMS/voice channel for low-literacy clients', desc: 'No SMS/voice channel for low-literacy clients', endpoint: '/gap-no-sms-voice-channel-for-low-literacy-clients' },
  { kind: 'gap-non', slug: 'gap-non-no-external-payment-rail-for-cash-assistance', label: 'No external payment-rail for cash assistance', desc: 'No external payment-rail for cash assistance', endpoint: '/gap-no-external-payment-rail-for-cash-assistance' },
];

function authHeaders() {
  const t = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

export default function Batch03Features() {
  const [active, setActive] = useState(FEATURES[0]?.slug);
  const [input, setInput] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const current = FEATURES.find(f => f.slug === active) || FEATURES[0];

  async function run() {
    if (!current) return;
    setLoading(true); setError(null);
    try {
      let parsed;
      try { parsed = input ? JSON.parse(input) : {}; } catch { parsed = { input }; }
      const r = await fetch(`${API_BASE}${current.endpoint}`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(parsed)
      });
      let body; try { body = await r.json(); } catch { body = { raw: await r.text() }; }
      if (!r.ok) setError(body.error || `HTTP ${r.status}`);
      setResults(prev => ({ ...prev, [current.slug]: body }));
    } catch (e) {
      setError(String(e.message || e));
    } finally { setLoading(false); }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ marginTop: 0 }}>Batch 03 Features <small style={{ color: '#64748b', fontWeight: 400 }}>(AIFoodBankPantryManager)</small></h2>
      <p style={{ color: '#475569', maxWidth: 720 }}>
        Audit-driven AI counterparts, non-AI feature gaps, and custom feature suggestions.
        Backend endpoints prefixed <code>/api/cf-*</code> (custom features) and <code>/api/gap-*</code> (gap fills).
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
        {FEATURES.map(f => (
          <button key={f.slug} onClick={() => setActive(f.slug)}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1',
                     background: active === f.slug ? '#1e40af' : '#f8fafc',
                     color: active === f.slug ? 'white' : '#0f172a', cursor: 'pointer', fontSize: 12 }}>
            <span style={{ opacity: 0.7, marginRight: 4 }}>[{f.kind}]</span>{f.label}
          </button>
        ))}
      </div>
      {current && (
        <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 8 }}>
            <strong>{current.label}</strong>
            <div style={{ color: '#475569', fontSize: 13 }}>{current.desc}</div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>POST <code>{current.endpoint}</code></div>
          </div>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            placeholder='Optional JSON input (e.g. {"query":"..."})'
            style={{ width: '100%', minHeight: 80, padding: 8, fontFamily: 'monospace', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4 }} />
          <div style={{ marginTop: 8 }}>
            <button onClick={run} disabled={loading}
              style={{ padding: '8px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Running…' : 'Run'}
            </button>
          </div>
          {error && (<div style={{ marginTop: 12, padding: 10, background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: 13 }}>{error}</div>)}
          {results[current.slug] && (
            <pre style={{ marginTop: 12, padding: 10, background: '#0b1020', color: '#cbd5e1', borderRadius: 4, overflow: 'auto', maxHeight: 360, fontSize: 12 }}>
              {typeof results[current.slug] === 'string' ? results[current.slug] : JSON.stringify(results[current.slug], null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
