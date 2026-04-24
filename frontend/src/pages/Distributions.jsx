import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'type', label: 'Type', badge: true },
  { key: 'location', label: 'Location' },
  { key: 'max_clients', label: 'Max Clients', type: 'number' },
  { key: 'registered_count', label: 'Registered', type: 'number' },
  { key: 'status', label: 'Status', badge: true },
];

const formFields = [
  { key: 'name', label: 'Event Name', placeholder: 'e.g., Saturday Distribution' },
  { key: 'date', label: 'Date & Time', type: 'datetime-local' },
  { key: 'type', label: 'Type', type: 'select', options: ['shopping', 'pre-packed', 'mobile', 'delivery'] },
  { key: 'location', label: 'Location', placeholder: 'e.g., Main Warehouse' },
  { key: 'max_clients', label: 'Max Clients', type: 'number' },
  { key: 'registered_count', label: 'Registered Count', type: 'number', default: '0' },
  { key: 'status', label: 'Status', type: 'select', options: ['scheduled', 'in-progress', 'completed', 'cancelled'] },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

export default function Distributions({ onLogout }) {
  return <CrudPage title="Distributions" apiPath="/distributions" columns={columns} formFields={formFields} onLogout={onLogout} />;
}
