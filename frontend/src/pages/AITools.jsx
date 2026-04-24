import React, { useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api';
import { Bot, FileText, Users, Package, AlertTriangle, Award, BarChart3, Sparkles, Send } from 'lucide-react';

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
];

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
      const data = await api.post(`/ai/${selectedTool.id}`, formData);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
                <AIResultDisplay result={result} />
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
