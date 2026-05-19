import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../api';
import { Bot, FileText, Users, Package, AlertTriangle, Award, BarChart3, Sparkles, Send, ShoppingBag, Heart } from 'lucide-react';

const aiTools = [
  {
    id: 'donation-appeal',
    title: 'Donation Appeal Generator',
    desc: 'Generate compelling donation appeal content for campaigns, emails, and social media.',
    icon: FileText,
    color: '#e76f51',
    fields: [
      { key: 'campaign_name', label: 'Campaign Name', placeholder: 'e.g., Holiday Food Drive 2026' },
      { key: 'target_audience', label: 'Target Audience', placeholder: 'e.g., local businesses, community members' },
      { key: 'goal', label: 'Goal', placeholder: 'e.g., Raise $50,000 and collect 10,000 lbs of food' },
      { key: 'tone', label: 'Tone', type: 'select', options: ['professional', 'heartfelt', 'urgent', 'casual', 'inspiring'] },
    ],
  },
  {
    id: 'volunteer-optimization',
    title: 'Volunteer Shift Optimizer',
    desc: 'AI-optimized volunteer scheduling based on availability, skills, and task requirements.',
    icon: Users,
    color: '#2a9d8f',
    fields: [
      { key: 'date', label: 'Date to Optimize', type: 'date' },
      { key: 'tasks', label: 'Tasks Needed', type: 'textarea', placeholder: 'e.g., Sorting (3 people), Front Desk (2), Delivery Driver (1)' },
    ],
  },
  {
    id: 'nutritional-analysis',
    title: 'Nutritional Balance Analyzer',
    desc: 'Analyze the nutritional balance of current inventory and distribution plans.',
    icon: Package,
    color: '#264653',
    fields: [],
  },
  {
    id: 'expiration-risk',
    title: 'Expiration Risk Predictor',
    desc: 'Predict and prioritize items at risk of expiration with recommended actions.',
    icon: AlertTriangle,
    color: '#e9c46a',
    fields: [],
  },
  {
    id: 'grant-assistant',
    title: 'Grant Application Assistant',
    desc: 'AI assistance for writing grant applications with tailored content.',
    icon: Award,
    color: '#6d6875',
    fields: [
      { key: 'grant_name', label: 'Grant Name', placeholder: 'e.g., USDA Community Food Projects' },
      { key: 'organization_info', label: 'Organization Info', type: 'textarea', placeholder: 'Brief description of your food bank...' },
      { key: 'amount_requested', label: 'Amount Requested', placeholder: 'e.g., $75,000' },
      { key: 'purpose', label: 'Purpose', type: 'textarea', placeholder: 'What the funds will be used for...' },
    ],
  },
  {
    id: 'community-assessment',
    title: 'Community Need Assessment',
    desc: 'Analyze intake data to assess community food insecurity patterns and needs.',
    icon: BarChart3,
    color: '#7209b7',
    fields: [],
  },
  {
    id: 'food-package-builder',
    title: 'Food Package Builder',
    desc: 'Build a personalized food box for a client, prioritizing expiring inventory and dietary needs.',
    icon: ShoppingBag,
    color: '#0891b2',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'number', placeholder: 'Enter client ID' },
      { key: 'household_size', label: 'Household Size', type: 'number', placeholder: 'e.g., 4' },
      { key: 'dietary_restrictions', label: 'Dietary Restrictions (optional)', placeholder: 'e.g., diabetic, gluten-free, halal' },
    ],
  },
  {
    id: 'donor-retention',
    title: 'Donor Retention Analyzer',
    desc: 'Analyze all active donors for churn risk and generate personalized re-engagement messages.',
    icon: Heart,
    color: '#be185d',
    fields: [],
  },
];

// ─── Donor Retention Structured Display ─────────────────────────────────────
function DonorRetentionDisplay({ result }) {
  if (!result) return null;

  const analysis = result.analysis;
  if (!Array.isArray(analysis)) {
    return <AIResultDisplay result={{ result: result.raw_response || JSON.stringify(analysis), generated_at: result.generated_at }} />;
  }

  const riskColor = { high: '#dc2626', medium: '#d97706', low: '#16a34a' };
  const riskBg = { high: '#fee2e2', medium: '#fef3c7', low: '#dcfce7' };

  return (
    <div className="ai-result">
      <div className="ai-result-header">
        <Sparkles size={18} />
        <span>Donor Retention Analysis — {result.total_donors_analyzed} donors analyzed</span>
        <span className="ai-result-time">{new Date(result.generated_at).toLocaleString()}</span>
      </div>
      <div style={{ padding: '12px 0' }}>
        {analysis.map((d, i) => (
          <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.95rem' }}>{d.donor_name || `Donor #${d.donor_id}`}</strong>
              <span style={{ padding: '2px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: riskBg[d.churn_risk] || '#f3f4f6', color: riskColor[d.churn_risk] || '#374151' }}>
                {(d.churn_risk || '').toUpperCase()} RISK
              </span>
            </div>
            {d.churn_score !== undefined && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>
                  <span>Churn Score</span><span>{d.churn_score}%</span>
                </div>
                <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${d.churn_score}%`, background: riskColor[d.churn_risk] || '#6b7280', borderRadius: '999px' }} />
                </div>
              </div>
            )}
            {d.risk_reason && <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '4px 0' }}>{d.risk_reason}</p>}
            {d.re_engagement_message && (
              <div style={{ marginTop: '8px', padding: '10px', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.83rem', color: '#0369a1', fontStyle: 'italic' }}>
                <strong style={{ display: 'block', fontStyle: 'normal', marginBottom: '4px', color: '#0c4a6e' }}>Suggested Re-engagement Message:</strong>
                {d.re_engagement_message}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Food Package Builder Structured Display ─────────────────────────────────
function FoodPackageDisplay({ result }) {
  if (!result) return null;

  const pkg = typeof result.package === 'object' && result.package !== null ? result.package : null;

  if (!pkg || !pkg.items) {
    return <AIResultDisplay result={{ result: result.raw_response || JSON.stringify(result.package), generated_at: result.generated_at }} />;
  }

  return (
    <div className="ai-result">
      <div className="ai-result-header">
        <Sparkles size={18} />
        <span>Food Package for {result.client?.name} (household of {result.client?.household_size})</span>
        <span className="ai-result-time">{new Date(result.generated_at).toLocaleString()}</span>
      </div>
      <div style={{ padding: '12px 0' }}>
        {pkg.package_name && <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>{pkg.package_name}</h3>}
        <div style={{ marginBottom: '14px' }}>
          <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', display: 'block', marginBottom: '8px' }}>Recommended Items</strong>
          {pkg.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '4px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <input type="checkbox" defaultChecked readOnly style={{ accentColor: '#2a9d8f' }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.name || item.item_name}</span>
                {(item.quantity || item.unit) && (
                  <span style={{ marginLeft: '8px', color: '#6b7280', fontSize: '0.8rem' }}>{item.quantity} {item.unit}</span>
                )}
              </div>
              {item.reason && <span style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>{item.reason}</span>}
            </div>
          ))}
        </div>
        {pkg.nutritional_summary && (
          <div style={{ marginBottom: '12px', padding: '10px 14px', background: '#f0fdf4', borderRadius: '6px' }}>
            <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#15803d', display: 'block', marginBottom: '6px' }}>Nutritional Balance</strong>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {Object.entries(pkg.nutritional_summary).map(([k, v]) => (
                <span key={k} style={{ padding: '2px 10px', background: '#dcfce7', borderRadius: '999px', fontSize: '0.75rem', color: '#166534' }}>
                  {k}: {v}
                </span>
              ))}
            </div>
          </div>
        )}
        {pkg.notes && (
          <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: '6px', fontSize: '0.85rem', color: '#92400e' }}>
            <strong>Notes: </strong>{pkg.notes}
          </div>
        )}
        {pkg.total_estimated_calories && (
          <div style={{ marginTop: '10px', padding: '8px 14px', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.85rem', color: '#0369a1' }}>
            <strong>Estimated Total Calories: </strong>{pkg.total_estimated_calories?.toLocaleString?.() || pkg.total_estimated_calories}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Expiration Risk Structured Display ──────────────────────────────────────
function ExpirationRiskDisplay({ result }) {
  if (!result || !result.result) return null;

  const text = result.result;
  const TIERS = ['EXPIRED', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'OK'];
  const tierColors = {
    EXPIRED: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' },
    CRITICAL: { bg: '#fff7ed', border: '#ea580c', text: '#9a3412' },
    HIGH: { bg: '#fffbeb', border: '#d97706', text: '#92400e' },
    MEDIUM: { bg: '#fefce8', border: '#ca8a04', text: '#713f12' },
    LOW: { bg: '#f0fdf4', border: '#16a34a', text: '#14532d' },
    OK: { bg: '#f0f9ff', border: '#0284c7', text: '#0c4a6e' },
  };

  // Parse items from text - look for [TIER] patterns
  const itemsByTier = {};
  TIERS.forEach(t => { itemsByTier[t] = []; });

  text.split('\n').forEach(line => {
    const match = line.match(/\[(EXPIRED|CRITICAL|HIGH|MEDIUM|LOW|OK)\]\s*(.+)/i);
    if (match) {
      const tier = match[1].toUpperCase();
      itemsByTier[tier] = itemsByTier[tier] || [];
      itemsByTier[tier].push(match[2].trim());
    }
  });

  const hasTieredItems = TIERS.some(t => itemsByTier[t].length > 0);

  // Extract waste estimate
  const wasteMatch = text.match(/(?:estimated\s+)?(?:food\s+)?waste[:\s]+([^\n.]+)/i);
  const dollarMatch = text.match(/\$[\d,]+(?:\s*(?:to|-)\s*\$[\d,]+)?/);

  return (
    <div className="ai-result">
      <div className="ai-result-header">
        <Sparkles size={18} />
        <span>Expiration Risk Analysis</span>
        <span className="ai-result-time">{new Date(result.generated_at).toLocaleString()}</span>
      </div>
      <div style={{ padding: '12px 0' }}>
        {(wasteMatch || dollarMatch) && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', marginBottom: '14px', fontSize: '0.875rem' }}>
            {wasteMatch && <div><strong>Estimated Waste: </strong><span style={{ color: '#dc2626', fontWeight: 600 }}>{wasteMatch[1].trim()}</span></div>}
            {dollarMatch && <div><strong>Dollar Value at Risk: </strong><span style={{ color: '#dc2626', fontWeight: 600 }}>{dollarMatch[0]}</span></div>}
          </div>
        )}
        {hasTieredItems && TIERS.filter(t => itemsByTier[t].length > 0).map(tier => (
          <div key={tier} style={{ marginBottom: '12px', border: `1px solid ${tierColors[tier].border}`, borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: tierColors[tier].bg, padding: '8px 14px', borderBottom: `1px solid ${tierColors[tier].border}` }}>
              <strong style={{ color: tierColors[tier].text, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {tier} ({itemsByTier[tier].length} item{itemsByTier[tier].length !== 1 ? 's' : ''})
              </strong>
            </div>
            <div style={{ padding: '8px 14px' }}>
              {itemsByTier[tier].map((item, i) => (
                <div key={i} style={{ fontSize: '0.83rem', padding: '3px 0', borderBottom: i < itemsByTier[tier].length - 1 ? '1px solid #f3f4f6' : 'none' }}>{item}</div>
              ))}
            </div>
          </div>
        ))}
        <AIResultDisplay result={result} />
      </div>
    </div>
  );
}

function AIResultDisplay({ result }) {
  if (!result) return null;

  const formatContent = (text) => {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = null;
    let currentContent = [];

    lines.forEach((line, i) => {
      const headerMatch = line.match(/^#{1,3}\s+(.+)/) || line.match(/^\*\*(.+?)\*\*\s*$/);
      if (headerMatch) {
        if (currentSection || currentContent.length > 0) {
          sections.push({ title: currentSection, content: currentContent.join('\n') });
        }
        currentSection = headerMatch[1].replace(/\*\*/g, '');
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    });
    if (currentSection || currentContent.length > 0) {
      sections.push({ title: currentSection, content: currentContent.join('\n') });
    }

    return sections.map((section, i) => (
      <div key={i} className="ai-result-section">
        {section.title && <h3 className="ai-result-section-title">{section.title}</h3>}
        <div className="ai-result-section-content">
          {section.content.split('\n').map((line, j) => {
            if (!line.trim()) return <br key={j} />;
            const bulletMatch = line.match(/^[\s]*[-•*]\s+(.+)/);
            if (bulletMatch) {
              return <div key={j} className="ai-bullet-point">{formatInlineText(bulletMatch[1])}</div>;
            }
            const numberedMatch = line.match(/^[\s]*(\d+)[.)]\s+(.+)/);
            if (numberedMatch) {
              return <div key={j} className="ai-numbered-point"><span className="ai-number">{numberedMatch[1]}</span>{formatInlineText(numberedMatch[2])}</div>;
            }
            return <p key={j}>{formatInlineText(line)}</p>;
          })}
        </div>
      </div>
    ));
  };

  const formatInlineText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      const boldMatch = part.match(/^\*\*(.+)\*\*$/);
      if (boldMatch) return <strong key={i}>{boldMatch[1]}</strong>;
      return part;
    });
  };

  return (
    <div className="ai-result">
      <div className="ai-result-header">
        <Sparkles size={18} />
        <span>AI Analysis Result</span>
        <span className="ai-result-time">{new Date(result.generated_at).toLocaleString()}</span>
      </div>
      <div className="ai-result-content">
        {formatContent(result.result)}
      </div>
    </div>
  );
}

export default function AITools({ onLogout }) {
  const [selectedTool, setSelectedTool] = useState(null);
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectTool = (tool) => {
    setSelectedTool(tool);
    setResult(null);
    setError('');
    const defaults = {};
    tool.fields.forEach(f => { defaults[f.key] = ''; });
    setFormData(defaults);
  };

  const runTool = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      // Map food-package-builder ID to backend endpoint
      const endpointMap = {
        'food-package-builder': '/ai/food-package-builder',
        'donor-retention': '/ai/donor-retention',
      };
      const endpoint = endpointMap[selectedTool.id] || `/ai/${selectedTool.id}`;
      const data = await api.post(endpoint, formData);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;
    if (selectedTool?.id === 'food-package-builder') return <FoodPackageDisplay result={result} />;
    if (selectedTool?.id === 'donor-retention') return <DonorRetentionDisplay result={result} />;
    if (selectedTool?.id === 'expiration-risk') return <ExpirationRiskDisplay result={result} />;
    return <AIResultDisplay result={result} />;
  };

  return (
    <Layout title="AI Tools" onLogout={onLogout}>
      {!selectedTool ? (
        <div className="ai-tools-grid">
          {aiTools.map(tool => (
            <div key={tool.id} className="ai-tool-card" onClick={() => selectTool(tool)} style={{ borderTop: `4px solid ${tool.color}` }}>
              <div className="ai-tool-icon" style={{ background: `${tool.color}15`, color: tool.color }}>
                <tool.icon size={28} />
              </div>
              <h3>{tool.title}</h3>
              <p>{tool.desc}</p>
              <button className="btn btn-primary btn-sm" style={{ background: tool.color, borderColor: tool.color }}>
                Launch Tool
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="ai-workspace">
          <div className="ai-workspace-header">
            <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedTool(null); setResult(null); }}>
              ← Back to Tools
            </button>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <selectedTool.icon size={24} style={{ color: selectedTool.color }} />
              {selectedTool.title}
            </h2>
          </div>

          <div className="ai-workspace-body">
            <div className="ai-input-panel">
              <p className="ai-tool-desc">{selectedTool.desc}</p>
              {selectedTool.fields.length > 0 ? (
                <div className="ai-form">
                  {selectedTool.fields.map(field => (
                    <div key={field.key} className="form-group">
                      <label>{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea className="form-input" rows={3} value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} placeholder={field.placeholder} />
                      ) : field.type === 'select' ? (
                        <select className="form-input" value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}>
                          <option value="">Select...</option>
                          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type={field.type || 'text'} className="form-input" value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} placeholder={field.placeholder} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ai-auto-note">
                  <Package size={18} />
                  <span>This tool automatically analyzes data from your database. No additional input needed.</span>
                </div>
              )}

              <button className="btn btn-primary" onClick={runTool} disabled={loading} style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {loading ? (
                  <>
                    <div className="spinner-sm"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Run Analysis
                  </>
                )}
              </button>

              {error && <div className="alert alert-danger" style={{ marginTop: '15px' }}>{error}</div>}
            </div>

            <div className="ai-output-panel">
              {loading ? (
                <div className="ai-loading">
                  <div className="spinner"></div>
                  <p>AI is analyzing your data...</p>
                  <p className="text-light">This may take a few seconds</p>
                </div>
              ) : result ? (
                renderResult()
              ) : (
                <div className="ai-empty">
                  <Bot size={48} style={{ opacity: 0.3 }} />
                  <p>Run the analysis to see AI-powered insights</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
