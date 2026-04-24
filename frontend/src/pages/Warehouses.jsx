import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type', badge: true },
  { key: 'address', label: 'Address' },
  { key: 'capacity_sqft', label: 'Capacity (sqft)', type: 'number' },
  { key: 'cooler_temp', label: 'Cooler (°F)' },
  { key: 'freezer_temp', label: 'Freezer (°F)' },
  { key: 'status', label: 'Status', badge: true },
];

const formFields = [
  { key: 'name', label: 'Warehouse Name', placeholder: 'e.g., Main Distribution Center' },
  { key: 'address', label: 'Address', fullWidth: true },
  { key: 'type', label: 'Type', type: 'select', options: ['main', 'satellite', 'mobile'] },
  { key: 'capacity_sqft', label: 'Capacity (sqft)', type: 'number' },
  { key: 'cooler_temp', label: 'Cooler Temp (°F)', type: 'number' },
  { key: 'freezer_temp', label: 'Freezer Temp (°F)', type: 'number' },
  { key: 'manager', label: 'Manager Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'maintenance'] },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

export default function Warehouses({ onLogout }) {
  return <CrudPage title="Warehouses" apiPath="/warehouses" columns={columns} formFields={formFields} onLogout={onLogout} />;
}
