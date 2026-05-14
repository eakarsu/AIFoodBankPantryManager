import React, { useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api';
import { Bot, Send, Sparkles, AlertTriangle, BarChart3, ShieldAlert, HeartHandshake } from 'lucide-react';

/**
 * Frontend for the 3 newer AI endpoints in backend/routes/ai.js:
 *   POST /api/ai/inventory-forecast
 *   POST /api/ai/distribution-optimize
 *   POST /api/ai/fraud-detect
 *
 * Mirrors AITools.jsx style — tool cards with form fields and a generic JSON
 * fallback display. Uses the existing `api.post` wrapper.
 */

const tools = [
  {
    id: 'inventory-forecast',
    title: 'Inventory Forecast',
    desc: 'Forecast shortfall by category, expiring items, and procurement priorities.',
    icon: BarChart3,
    color: '#0d9488',
    path: '/ai/inventory-forecast',
    fields: [
      { key: 'horizon_days', label: 'Forecast horizon (days)', type: 'number', placeholder: 'e.g., 14' },
      { key: 'lookback_days', label: 'Lookback (days)', type: 'number', placeholder: 'e.g., 30' },
      { key: 'notes', label: 'Notes (optional)', type: 'textarea', placeholder: 'Seasonal events, school holidays, weather...' },
    ],
  },
  {
    id: 'distribution-optimize',
    title: 'Distribution Optimizer',
    desc: 'Allocate available inventory across clients with leftovers and a fairness score.',
    icon: Sparkles,
    color: '#7c3aed',
    path: '/ai/distribution-optimize',
    fields: [
      { key: 'distribution_date', label: 'Distribution date', type: 'date' },
      { key: 'fairness_priority', label: 'Fairness priority', type: 'select', options: ['balanced', 'household_size', 'need_severity', 'first_come'] },
      { key: 'notes', label: 'Notes (optional)', type: 'textarea', placeholder: 'Constraints, dietary mix, special cases...' },
    ],
  },
  {
    id: 'fraud-detect',
    title: 'Fraud Pattern Detection',
    desc: 'Heuristic + AI review of duplicate / abnormal client visits.',
    icon: ShieldAlert,
    color: '#dc2626',
    path: '/ai/fraud-detect',
    fields: [
      { key: 'sensitivity', label: 'Sensitivity', type: 'select', options: ['low', 'medium', 'high'] },
      { key: 'lookback_days', label: 'Lookback (days)', type: 'number', placeholder: 'e.g., 90' },
    ],
  },
  {
    id: 'need-predict',
    title: 'Proactive Need Prediction',
    desc: 'Predict at-risk / lapsing clients and recommend outreach action.',
    icon: HeartHandshake,
    color: '#2563eb',
    path: '/ai/need-predict',
    fields: [
      { key: 'horizon_days', label: 'Prediction horizon (days)', type: 'number', placeholder: 'e.g., 30' },
      { key: 'focus_segment', label: 'Focus segment (optional)', type: 'text', placeholder: 'e.g. seniors, families with young children' },
      { key: 'notes', label: 'Notes (optional)', type: 'textarea', placeholder: 'Local events, weather, school schedule...' },
    ],
  },
];

function ResultCard({ result, error }) {
  if (error) {
    return (
      <div className="ai-result" style={{ borderColor: '#dc2626' }}>
        <div className="ai-result-header" style={{ color: '#dc2626' }}>
          <AlertTriangle size={18} />
          <span>Error</span>
        </div>
        <div style={{ padding: '12px 0', color: '#dc2626' }}>{error}</div>
      </div>
    );
  }
  if (!result) return null;
  return (
    <div className="ai-result">
      <div className="ai-result-header">
        <Sparkles size={18} />
        <span>AI Result</span>
        {result.generated_at && <span className="ai-result-time">{new Date(result.generated_at).toLocaleString()}</span>}
      </div>
      <div style={{ padding: '12px 0' }}>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default function AIAdvancedTools({ onLogout }) {
  const [activeId, setActiveId] = useState(null);
  const [formState, setFormState] = useState({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});

  const active = tools.find((t) => t.id === activeId) || null;

  const handleFieldChange = (toolId, key, value) => {
    setFormState((prev) => ({
      ...prev,
      [toolId]: { ...(prev[toolId] || {}), [key]: value },
    }));
  };

  const submit = async (tool) => {
    setLoading(true);
    setErrors((prev) => ({ ...prev, [tool.id]: null }));
    setResults((prev) => ({ ...prev, [tool.id]: null }));
    try {
      const payload = formState[tool.id] || {};
      // coerce numeric fields
      const sanitized = {};
      Object.keys(payload).forEach((k) => {
        const fieldDef = tool.fields.find((f) => f.key === k);
        if (fieldDef?.type === 'number') {
          sanitized[k] = payload[k] === '' ? undefined : Number(payload[k]);
        } else {
          sanitized[k] = payload[k];
        }
      });
      const res = await api.post(tool.path, sanitized);
      setResults((prev) => ({ ...prev, [tool.id]: res }));
    } catch (e) {
      setErrors((prev) => ({ ...prev, [tool.id]: e.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="AI Advanced Tools" onLogout={onLogout}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Bot size={28} style={{ color: '#0d9488' }} />
        <p style={{ margin: 0, color: '#6b7280' }}>
          Forecasting, distribution optimization, and fraud detection from the new <code>/api/ai</code> endpoints.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = activeId === t.id;
          return (
            <div
              key={t.id}
              onClick={() => setActiveId(t.id)}
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'white',
                border: `2px solid ${isActive ? t.color : '#e5e7eb'}`,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ background: `${t.color}20`, color: t.color, padding: '8px', borderRadius: '8px', display: 'flex' }}>
                  <Icon size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{t.title}</h3>
              </div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>{t.desc}</p>
            </div>
          );
        })}
      </div>

      {active && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{active.title}</h2>
          <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '0.875rem' }}>{active.desc}</p>

          {active.fields.map((f) => {
            const value = (formState[active.id] || {})[f.key] ?? '';
            return (
              <div key={f.key} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#374151', marginBottom: '4px' }}>
                  {f.label}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    placeholder={f.placeholder}
                    value={value}
                    onChange={(e) => handleFieldChange(active.id, f.key, e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                  />
                ) : f.type === 'select' ? (
                  <select
                    value={value || (f.options ? f.options[0] : '')}
                    onChange={(e) => handleFieldChange(active.id, f.key, e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                  >
                    {f.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={value}
                    onChange={(e) => handleFieldChange(active.id, f.key, e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                  />
                )}
              </div>
            );
          })}

          <button
            onClick={() => submit(active)}
            disabled={loading}
            style={{
              padding: '10px 18px',
              background: active.color,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}
          >
            <Send size={14} /> {loading ? 'Running...' : 'Run AI Tool'}
          </button>

          <div style={{ marginTop: '20px' }}>
            <ResultCard result={results[active.id]} error={errors[active.id]} />
          </div>
        </div>
      )}
    </Layout>
  );
}
