import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'donor_name', label: 'Donor', render: (v, row) => row.donor_name || `Donor #${row.donor_id}` },
  { key: 'amount', label: 'Amount', type: 'currency' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'method', label: 'Method', badge: true },
  { key: 'designation', label: 'Designation' },
  { key: 'tax_receipt_number', label: 'Receipt #' },
  { key: 'tax_receipt_sent', label: 'Receipt Sent', type: 'boolean' },
];

const formFields = [
  { key: 'donor_id', label: 'Donor ID', type: 'number', placeholder: 'Donor ID number' },
  { key: 'amount', label: 'Amount ($)', type: 'number' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'method', label: 'Method', type: 'select', options: ['cash', 'check', 'credit', 'online', 'stock', 'wire'] },
  { key: 'designation', label: 'Designation', placeholder: 'e.g., general, capital campaign' },
  { key: 'tax_receipt_number', label: 'Tax Receipt Number' },
  { key: 'tax_receipt_sent', label: 'Receipt Sent', type: 'checkbox', checkLabel: 'Tax receipt has been sent' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

export default function Donations({ onLogout }) {
  return <CrudPage title="Donations" apiPath="/donations" columns={columns} formFields={formFields} onLogout={onLogout} />;
}
