import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'total_hours', label: 'Hours', type: 'number' },
  { key: 'background_check', label: 'BG Check', type: 'boolean' },
  { key: 'status', label: 'Status', badge: true },
];

const formFields = [
  { key: 'name', label: 'Full Name', placeholder: 'Jane Smith' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'role', label: 'Role', type: 'select', options: ['sorter', 'driver', 'front-desk', 'warehouse', 'intake-specialist', 'kitchen', 'data-entry', 'coordinator', 'manager'] },
  { key: 'availability', label: 'Availability', placeholder: 'e.g., Mon/Wed/Fri mornings' },
  { key: 'skills', label: 'Skills', type: 'textarea', placeholder: 'CDL, forklift certified, bilingual...' },
  { key: 'background_check', label: 'Background Check', type: 'checkbox', checkLabel: 'Background check completed' },
  { key: 'emergency_contact', label: 'Emergency Contact', placeholder: 'Name: (555) 123-4567' },
  { key: 'total_hours', label: 'Total Hours', type: 'number', default: '0' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'on-leave'] },
  { key: 'start_date', label: 'Start Date', type: 'date' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

export default function Volunteers({ onLogout }) {
  return <CrudPage title="Volunteers" apiPath="/volunteers" columns={columns} formFields={formFields} onLogout={onLogout} />;
}
