import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Route Name' },
  { key: 'driver', label: 'Driver' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'total_miles', label: 'Miles', type: 'number' },
  { key: 'estimated_time', label: 'Est. Time' },
  { key: 'status', label: 'Status', badge: true },
];

const formFields = [
  { key: 'name', label: 'Route Name', placeholder: 'e.g., North Side Monday Route' },
  { key: 'driver', label: 'Driver Name', placeholder: 'Driver name' },
  { key: 'vehicle_id', label: 'Vehicle ID', type: 'number' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: ['planned', 'in-progress', 'completed'] },
  { key: 'total_miles', label: 'Total Miles', type: 'number' },
  { key: 'estimated_time', label: 'Estimated Time', placeholder: 'e.g., 3 hours' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

export default function DeliveryRoutes({ onLogout }) {
  return <CrudPage title="Delivery Routes" apiPath="/delivery-routes" columns={columns} formFields={formFields} onLogout={onLogout} />;
}
