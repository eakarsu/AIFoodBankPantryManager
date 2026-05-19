import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import Modal from './Modal';
import { api } from '../api';
import { Plus, Search, Edit2, Trash2, X, Eye } from 'lucide-react';

export default function CrudPage({ title, apiPath, columns, formFields, onLogout, renderDetail, formatRow }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchItems = async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.get(`${apiPath}?page=${p}&limit=20`);
      if (data && data.data && data.pagination) {
        setItems(data.data);
        setPagination(data.pagination);
      } else {
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(page); }, [page]);

  const openNew = () => {
    setEditItem(null);
    const defaults = {};
    formFields.forEach(f => { defaults[f.key] = f.default || ''; });
    setFormData(defaults);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    const data = {};
    formFields.forEach(f => {
      let val = item[f.key];
      if (f.type === 'date' && val) val = val.split('T')[0];
      data[f.key] = val ?? '';
    });
    setFormData(data);
    setShowModal(true);
    setSelectedItem(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`${apiPath}/${editItem.id}`, formData);
      } else {
        await api.post(apiPath, formData);
      }
      setShowModal(false);
      fetchItems(page);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`${apiPath}/${id}`);
      if (selectedItem?.id === id) setSelectedItem(null);
      fetchItems(page);
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = items.filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    return columns.some(col => {
      const val = item[col.key];
      return val && String(val).toLowerCase().includes(s);
    });
  });

  const renderFormField = (field) => {
    const val = formData[field.key] ?? '';
    const onChange = (e) => setFormData({ ...formData, [field.key]: field.type === 'checkbox' ? e.target.checked : e.target.value });

    if (field.type === 'select') {
      return (
        <select className="form-input" value={val} onChange={onChange}>
          <option value="">Select {field.label}</option>
          {field.options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
        </select>
      );
    }
    if (field.type === 'textarea') {
      return <textarea className="form-input" value={val} onChange={onChange} rows={3} placeholder={field.placeholder || ''} />;
    }
    if (field.type === 'checkbox') {
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" checked={!!val} onChange={onChange} />
          {field.checkLabel || 'Yes'}
        </label>
      );
    }
    return <input type={field.type || 'text'} className="form-input" value={val} onChange={onChange} placeholder={field.placeholder || ''} step={field.type === 'number' ? 'any' : undefined} />;
  };

  const getCellValue = (item, col) => {
    if (col.render) return col.render(item[col.key], item);
    const val = item[col.key];
    if (val === null || val === undefined) return '—';
    if (col.type === 'date' && val) return new Date(val).toLocaleDateString();
    if (col.type === 'boolean') return val ? 'Yes' : 'No';
    if (col.type === 'currency') return `$${Number(val).toLocaleString()}`;
    if (col.type === 'number') return Number(val).toLocaleString();
    return String(val);
  };

  const getBadgeClass = (val) => {
    const v = String(val).toLowerCase();
    if (['active', 'available', 'completed', 'awarded', 'yes'].includes(v)) return 'badge badge-success';
    if (['inactive', 'retired', 'cancelled', 'denied', 'expired'].includes(v)) return 'badge badge-danger';
    if (['pending', 'planned', 'scheduled', 'applied', 'maintenance'].includes(v)) return 'badge badge-warning';
    if (['in-progress', 'in-use', 'on-leave'].includes(v)) return 'badge badge-info';
    return 'badge';
  };

  return (
    <Layout title={title} onLogout={onLogout}>
      <div className="page-toolbar">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> New {title.replace(/s$/, '').replace(/ie$/, 'y')}
        </button>
      </div>

      {selectedItem && (
        <div className="detail-panel">
          <div className="detail-header">
            <h2>
              {columns[0] && (selectedItem[columns[0].key] || '')}
              {columns[1] && selectedItem[columns[1].key] ? ` ${selectedItem[columns[1].key]}` : ''}
            </h2>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => openEdit(selectedItem)}><Edit2 size={14} /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedItem.id)}><Trash2 size={14} /> Delete</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedItem(null)}><X size={14} /></button>
            </div>
          </div>
          <div className="detail-body">
            {renderDetail ? renderDetail(selectedItem) : (
              <div className="detail-grid">
                {formFields.map(f => (
                  <div key={f.key} className="detail-field">
                    <label>{f.label}</label>
                    <span>{(() => {
                      const val = selectedItem[f.key];
                      if (val === null || val === undefined) return '—';
                      if (f.type === 'date' && val) return new Date(val).toLocaleDateString();
                      if (f.type === 'checkbox') return val ? 'Yes' : 'No';
                      return String(val);
                    })()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No {title} Found</h3>
          <p>Click "New" to add your first item.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(col => <th key={col.key}>{col.label}</th>)}
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className={selectedItem?.id === item.id ? 'selected' : ''} onClick={() => setSelectedItem(item)} style={{ cursor: 'pointer' }}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.badge ? <span className={getBadgeClass(item[col.key])}>{getCellValue(item, col)}</span> : getCellValue(item, col)}
                    </td>
                  ))}
                  <td onClick={e => e.stopPropagation()}>
                    <div className="row-actions">
                      <button className="btn-icon" title="View" onClick={() => setSelectedItem(item)}><Eye size={15} /></button>
                      <button className="btn-icon" title="Edit" onClick={() => openEdit(item)}><Edit2 size={15} /></button>
                      <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => handleDelete(item.id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
              <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.875rem' }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
              <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.875rem' }} onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}>Next</button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? `Edit ${title.replace(/s$/, '')}` : `New ${title.replace(/s$/, '')}`} size="large">
        <form onSubmit={handleSave}>
          <div className="form-grid">
            {formFields.map(f => (
              <div key={f.key} className={`form-group ${f.fullWidth ? 'full-width' : ''}`}>
                <label>{f.label}</label>
                {renderFormField(f)}
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
