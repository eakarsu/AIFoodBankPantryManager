import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../api';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';

const ENDPOINT_LABELS = {
  'donation-appeal': 'Donation Appeal',
  'volunteer-optimization': 'Volunteer Optimization',
  'nutritional-analysis': 'Nutritional Analysis',
  'expiration-risk': 'Expiration Risk',
  'grant-assistant': 'Grant Assistant',
  'community-assessment': 'Community Assessment',
  'food-package-builder': 'Food Package Builder',
  'donor-retention': 'Donor Retention',
  'delivery-route': 'Delivery Route',
};

export default function AIHistory({ onLogout }) {
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { fetchResults(page); }, [page]);

  const fetchResults = async (p) => {
    setLoading(true);
    try {
      const data = await api.get(`/ai-results?page=${p}&limit=20`);
      setResults(data.data || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString();
  const preview = (text) => {
    if (!text) return '—';
    const plain = text.replace(/[#*`]/g, '').replace(/\n+/g, ' ').trim();
    return plain.length > 120 ? plain.substring(0, 120) + '…' : plain;
  };

  return (
    <Layout title="AI Results History" onLogout={onLogout}>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤖</div>
          <h3>No AI Results Yet</h3>
          <p>Run an AI tool to see history here.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tool</th>
                <th>Timestamp</th>
                <th>Input Data</th>
                <th>Result Preview</th>
                <th style={{ width: '80px' }}></th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <React.Fragment key={r.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                        {ENDPOINT_LABELS[r.endpoint] || r.endpoint}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#6b7280' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} />{formatDate(r.created_at)}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.input_data ? Object.entries(r.input_data).map(([k, v]) => `${k}: ${v}`).join(', ') : '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>
                      {preview(r.result)}
                    </td>
                    <td>
                      <button className="btn-icon" title={expandedId === r.id ? 'Collapse' : 'Expand'}>
                        {expandedId === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </td>
                  </tr>
                  {expandedId === r.id && (
                    <tr>
                      <td colSpan={5} style={{ padding: '0' }}>
                        <div style={{ background: '#f9fafb', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                          {r.input_data && Object.keys(r.input_data).length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <strong style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Input</strong>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                                {Object.entries(r.input_data).map(([k, v]) => (
                                  <span key={k} style={{ padding: '2px 8px', background: '#e5e7eb', borderRadius: '4px', fontSize: '0.75rem' }}>
                                    <strong>{k}:</strong> {String(v)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <strong style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Full Result</strong>
                          <pre style={{ marginTop: '6px', fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: '400px', overflowY: 'auto', color: '#1f2937' }}>
                            {r.result}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
              <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
              <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}>Next</button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
