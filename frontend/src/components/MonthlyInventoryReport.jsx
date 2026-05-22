import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function MonthlyInventoryReport() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = (m) => {
    setLoading(true);
    setErr('');
    api.get(`/custom-views/monthly-report?month=${m}`)
      .then(setData)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(month); }, []);

  const downloadTxt = () => {
    if (!data?.report_text) return;
    const blob = new Blob([data.report_text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `inventory-report-${data.month}.txt`;
    a.click();
  };

  const printPdf = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<pre style="font-family: monospace; padding: 24px;">${(data?.report_text || '').replace(/</g, '&lt;')}</pre>`);
    w.document.close();
    setTimeout(() => w.print(), 200);
  };

  return (
    <div style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ marginTop: 0 }}>Monthly Inventory Report</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <label style={{ fontSize: 13 }}>Month:</label>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '4px 8px' }} />
        <button onClick={() => load(month)} style={{ padding: '4px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Refresh</button>
        <button onClick={downloadTxt} disabled={!data} style={{ padding: '4px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Download .txt</button>
        <button onClick={printPdf} disabled={!data} style={{ padding: '4px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Print / PDF</button>
      </div>
      {err && <div style={{ color: '#c00' }}>Error: {err}</div>}
      {loading && <div>Loading...</div>}
      {data && (
        <pre style={{
          background: '#0f172a', color: '#e2e8f0', padding: 16, borderRadius: 6,
          fontSize: 12, maxHeight: 420, overflow: 'auto',
        }}>{data.report_text}</pre>
      )}
    </div>
  );
}
