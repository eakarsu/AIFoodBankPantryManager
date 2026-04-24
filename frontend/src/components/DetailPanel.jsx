import React from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';

export default function DetailPanel({ item, fields, onClose, onEdit, onDelete, title }) {
  if (!item) return null;
  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h2>{title}</h2>
        <div className="detail-actions">
          <button className="btn btn-primary btn-sm" onClick={() => onEdit(item)}>
            <Edit2 size={14} /> Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(item.id)}>
            <Trash2 size={14} /> Delete
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="detail-body">
        {fields.map(f => (
          <div key={f.key} className="detail-field">
            <label>{f.label}</label>
            <span>{f.render ? f.render(item[f.key], item) : (item[f.key] ?? '—')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
