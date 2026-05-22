import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function InventoryFlowChart() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/custom-views/inventory-flow')
      .then(setData)
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div style={{ padding: 16, color: '#c00' }}>Error: {err}</div>;
  if (!data) return <div style={{ padding: 16 }}>Loading inventory flow...</div>;

  const series = data.series || [];
  const max = Math.max(1, ...series.map(s => Math.max(s.in_lbs, s.out_lbs)));

  return (
    <div style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ marginTop: 0 }}>Inventory In/Out Flow (last 6 months)</h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 13 }}>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#22c55e', marginRight: 4 }} />In (lbs)</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#ef4444', marginRight: 4 }} />Out (lbs)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 220, borderBottom: '2px solid #e5e7eb', borderLeft: '2px solid #e5e7eb', padding: '0 8px' }}>
        {series.length === 0 && <div style={{ color: '#888' }}>No data for the selected period.</div>}
        {series.map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 180 }}>
              <div title={`In ${s.in_lbs} lbs`} style={{ width: 22, background: '#22c55e', height: `${(s.in_lbs / max) * 180}px` }} />
              <div title={`Out ${s.out_lbs} lbs`} style={{ width: 22, background: '#ef4444', height: `${(s.out_lbs / max) * 180}px` }} />
            </div>
            <div style={{ fontSize: 11 }}>{s.period}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Total In: <strong>{(data.totals?.in_lbs || 0).toFixed(0)} lbs</strong>
        &nbsp;&nbsp;Total Out: <strong>{(data.totals?.out_lbs || 0).toFixed(0)} lbs</strong>
      </div>
    </div>
  );
}
