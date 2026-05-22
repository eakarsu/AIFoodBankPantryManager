import React, { useEffect, useState } from 'react';
import { api } from '../api';

function colorFor(v, max) {
  if (max <= 0) return '#f3f4f6';
  const ratio = Math.min(1, v / max);
  // green -> red gradient
  const r = Math.round(34 + (239 - 34) * ratio);
  const g = Math.round(197 + (68 - 197) * ratio);
  const b = Math.round(94 + (68 - 94) * ratio);
  return `rgba(${r},${g},${b},${0.25 + ratio * 0.65})`;
}

export default function DonorSourceHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/custom-views/donor-source-heatmap')
      .then(setData)
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div style={{ padding: 16, color: '#c00' }}>Error: {err}</div>;
  if (!data) return <div style={{ padding: 16 }}>Loading donor heatmap...</div>;

  const max = Math.max(1, ...(data.matrix || []).flatMap(r => r.cells.map(c => c.lbs)));

  return (
    <div style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ marginTop: 0 }}>Donor x Food Category Heatmap</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Donor</th>
              {(data.categories || []).map(c => (
                <th key={c} style={{ padding: '6px 10px', borderBottom: '1px solid #e5e7eb', fontSize: 12 }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.matrix || []).map(row => (
              <tr key={row.donor_id}>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6', fontWeight: 500, fontSize: 13 }}>{row.donor_name}</td>
                {row.cells.map((c, i) => (
                  <td key={i} title={`${c.category}: ${c.lbs} lbs`} style={{
                    padding: '6px 10px',
                    borderBottom: '1px solid #f3f4f6',
                    background: colorFor(c.lbs, max),
                    textAlign: 'center',
                    fontSize: 12,
                  }}>{Math.round(c.lbs)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
        Total donated weight: <strong>{Math.round(data.total_donated_lbs || 0)} lbs</strong>
      </div>
    </div>
  );
}
