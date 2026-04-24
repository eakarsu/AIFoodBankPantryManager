import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Vehicle Name' },
  { key: 'type', label: 'Type', badge: true },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'year', label: 'Year' },
  { key: 'license_plate', label: 'Plate' },
  { key: 'mileage', label: 'Mileage', type: 'number' },
  { key: 'status', label: 'Status', badge: true },
];

const formFields = [
  { key: 'name', label: 'Vehicle Name', placeholder: 'e.g., Delivery Van #1' },
  { key: 'type', label: 'Type', type: 'select', options: ['truck', 'van', 'car', 'refrigerated-truck', 'pickup'] },
  { key: 'make', label: 'Make', placeholder: 'e.g., Ford' },
  { key: 'model', label: 'Model', placeholder: 'e.g., Transit' },
  { key: 'year', label: 'Year', type: 'number' },
  { key: 'license_plate', label: 'License Plate' },
  { key: 'mileage', label: 'Mileage', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['available', 'in-use', 'maintenance', 'retired'] },
  { key: 'insurance_expiry', label: 'Insurance Expiry', type: 'date' },
  { key: 'last_service', label: 'Last Service', type: 'date' },
  { key: 'next_service', label: 'Next Service', type: 'date' },
  { key: 'capacity_lbs', label: 'Capacity (lbs)', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

export default function Fleet({ onLogout }) {
  return <CrudPage title="Fleet" apiPath="/fleet" columns={columns} formFields={formFields} onLogout={onLogout} />;
}
