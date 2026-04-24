import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'client_name', label: 'Client', render: (v, row) => row.client_name || `Client #${row.client_id}` },
  { key: 'visit_date', label: 'Visit Date', type: 'date' },
  { key: 'distribution_type', label: 'Type', badge: true },
  { key: 'weight_lbs', label: 'Weight (lbs)', type: 'number' },
  { key: 'served_by', label: 'Served By' },
];

const formFields = [
  { key: 'client_id', label: 'Client ID', type: 'number', placeholder: 'Enter client ID' },
  { key: 'visit_date', label: 'Visit Date', type: 'date' },
  { key: 'distribution_type', label: 'Distribution Type', type: 'select', options: ['shopping', 'pre-packed', 'delivery', 'mobile'] },
  { key: 'items_received', label: 'Items Received', type: 'textarea', fullWidth: true, placeholder: 'List of items received...' },
  { key: 'weight_lbs', label: 'Total Weight (lbs)', type: 'number' },
  { key: 'served_by', label: 'Served By', placeholder: 'Volunteer/staff name' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

export default function Visits({ onLogout }) {
  return <CrudPage title="Visits" apiPath="/visits" columns={columns} formFields={formFields} onLogout={onLogout} />;
}
