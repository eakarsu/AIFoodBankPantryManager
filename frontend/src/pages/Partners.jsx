import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type', badge: true },
  { key: 'contact_name', label: 'Contact' },
  { key: 'service_area', label: 'Service Area' },
  { key: 'clients_served', label: 'Clients Served', type: 'number' },
  { key: 'status', label: 'Status', badge: true },
];

const formFields = [
  { key: 'name', label: 'Agency Name', placeholder: 'e.g., Hope Community Center' },
  { key: 'type', label: 'Type', type: 'select', options: ['pantry', 'shelter', 'church', 'school', 'community-center'] },
  { key: 'address', label: 'Address', fullWidth: true },
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'contact_email', label: 'Contact Email', type: 'email' },
  { key: 'contact_phone', label: 'Contact Phone' },
  { key: 'service_area', label: 'Service Area', placeholder: 'e.g., North District' },
  { key: 'clients_served', label: 'Clients Served', type: 'number', default: '0' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
  { key: 'agreement_date', label: 'Agreement Date', type: 'date' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

export default function Partners({ onLogout }) {
  return <CrudPage title="Partners" apiPath="/partners" columns={columns} formFields={formFields} onLogout={onLogout} />;
}
