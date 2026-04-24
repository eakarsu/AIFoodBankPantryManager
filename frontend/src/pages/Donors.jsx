import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type', badge: true },
  { key: 'contact_person', label: 'Contact' },
  { key: 'phone', label: 'Phone' },
  { key: 'donation_frequency', label: 'Frequency' },
  { key: 'total_donated_lbs', label: 'Donated (lbs)', type: 'number' },
  { key: 'status', label: 'Status', badge: true },
];

const formFields = [
  { key: 'name', label: 'Donor Name', placeholder: 'e.g., Local Grocery Inc.' },
  { key: 'type', label: 'Type', type: 'select', options: ['individual', 'corporation', 'grocery', 'farm', 'restaurant'] },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address', fullWidth: true },
  { key: 'contact_person', label: 'Contact Person' },
  { key: 'donation_frequency', label: 'Frequency', type: 'select', options: ['one-time', 'weekly', 'monthly', 'quarterly', 'annual'] },
  { key: 'total_donated_lbs', label: 'Total Donated (lbs)', type: 'number' },
  { key: 'total_donated_value', label: 'Total Donated Value ($)', type: 'number' },
  { key: 'tax_id', label: 'Tax ID' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

export default function Donors({ onLogout }) {
  return <CrudPage title="Donors" apiPath="/donors" columns={columns} formFields={formFields} onLogout={onLogout} />;
}
