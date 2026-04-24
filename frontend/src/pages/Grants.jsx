import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Grant Name' },
  { key: 'grantor', label: 'Grantor' },
  { key: 'amount', label: 'Amount', type: 'currency' },
  { key: 'start_date', label: 'Start', type: 'date' },
  { key: 'end_date', label: 'End', type: 'date' },
  { key: 'status', label: 'Status', badge: true },
];

const formFields = [
  { key: 'name', label: 'Grant Name', placeholder: 'e.g., USDA TEFAP Program' },
  { key: 'grantor', label: 'Grantor', placeholder: 'Funding organization' },
  { key: 'amount', label: 'Amount ($)', type: 'number' },
  { key: 'start_date', label: 'Start Date', type: 'date' },
  { key: 'end_date', label: 'End Date', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: ['applied', 'awarded', 'active', 'completed', 'denied'] },
  { key: 'category', label: 'Category', placeholder: 'e.g., federal, state, private' },
  { key: 'requirements', label: 'Requirements', type: 'textarea', fullWidth: true },
  { key: 'reporting_frequency', label: 'Reporting Frequency', type: 'select', options: ['monthly', 'quarterly', 'semi-annual', 'annual'] },
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'contact_email', label: 'Contact Email', type: 'email' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

export default function Grants({ onLogout }) {
  return <CrudPage title="Grants" apiPath="/grants" columns={columns} formFields={formFields} onLogout={onLogout} />;
}
