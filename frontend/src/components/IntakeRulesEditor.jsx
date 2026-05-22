import React, { useEffect, useState } from 'react';
import { api } from '../api';

const EMPTY = { name: '', kind: 'expiry', days_before_expiry: 0, action: 'flag', allergens: '', notes: '' };

export default function IntakeRulesEditor() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.get('/custom-views/intake-rules').then(d => setRules(d.rules || [])).catch(e => setErr(e.message));

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const body = {
        ...form,
        days_before_expiry: Number(form.days_before_expiry) || 0,
        allergens: form.allergens
          ? form.allergens.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };
      if (editId) {
        await api.put(`/custom-views/intake-rules/${editId}`, body);
      } else {
        await api.post('/custom-views/intake-rules', body);
      }
      setForm(EMPTY);
      setEditId(null);
      load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const startEdit = (r) => {
    setEditId(r.id);
    setForm({
      name: r.name || '',
      kind: r.kind || 'expiry',
      days_before_expiry: r.days_before_expiry || 0,
      action: r.action || 'flag',
      allergens: (r.allergens || []).join(', '),
      notes: r.notes || '',
    });
  };

  const remove = async (id) => {
    if (!confirm('Delete this rule?')) return;
    await api.delete(`/custom-views/intake-rules/${id}`);
    load();
  };

  return (
    <div style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ marginTop: 0 }}>Intake / Distribution Rules</h3>
      {err && <div style={{ color: '#c00', marginBottom: 8 }}>Error: {err}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        <input required placeholder="Rule name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: 6 }} />
        <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })} style={{ padding: 6 }}>
          <option value="expiry">expiry</option>
          <option value="allergen">allergen</option>
          <option value="storage">storage</option>
          <option value="distribution">distribution</option>
        </select>
        <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} style={{ padding: 6 }}>
          <option value="flag">flag</option>
          <option value="block">block</option>
          <option value="warn">warn</option>
        </select>
        <input type="number" placeholder="Days before expiry" value={form.days_before_expiry} onChange={e => setForm({ ...form, days_before_expiry: e.target.value })} style={{ padding: 6 }} />
        <input placeholder="Allergens (comma)" value={form.allergens} onChange={e => setForm({ ...form, allergens: e.target.value })} style={{ padding: 6 }} />
        <input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ padding: 6 }} />
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
          <button type="submit" disabled={busy} style={{ padding: '6px 14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4 }}>
            {editId ? 'Update Rule' : 'Add Rule'}
          </button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm(EMPTY); }} style={{ padding: '6px 14px' }}>Cancel</button>}
        </div>
      </form>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ textAlign: 'left', padding: 6 }}>Name</th>
            <th style={{ textAlign: 'left', padding: 6 }}>Kind</th>
            <th style={{ textAlign: 'left', padding: 6 }}>Action</th>
            <th style={{ textAlign: 'left', padding: 6 }}>Days</th>
            <th style={{ textAlign: 'left', padding: 6 }}>Allergens</th>
            <th style={{ textAlign: 'left', padding: 6 }}>Notes</th>
            <th style={{ padding: 6 }}></th>
          </tr>
        </thead>
        <tbody>
          {rules.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: 6 }}>{r.name}</td>
              <td style={{ padding: 6 }}>{r.kind}</td>
              <td style={{ padding: 6 }}>{r.action}</td>
              <td style={{ padding: 6 }}>{r.days_before_expiry}</td>
              <td style={{ padding: 6 }}>{(r.allergens || []).join(', ')}</td>
              <td style={{ padding: 6, color: '#666' }}>{r.notes}</td>
              <td style={{ padding: 6, whiteSpace: 'nowrap' }}>
                <button onClick={() => startEdit(r)} style={{ marginRight: 6 }}>Edit</button>
                <button onClick={() => remove(r.id)} style={{ color: '#c00' }}>Delete</button>
              </td>
            </tr>
          ))}
          {rules.length === 0 && (
            <tr><td colSpan={7} style={{ padding: 12, color: '#888', textAlign: 'center' }}>No rules defined.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
