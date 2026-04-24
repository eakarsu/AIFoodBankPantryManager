import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Drive Name' },
  { key: 'organizer', label: 'Organizer' },
  { key: 'start_date', label: 'Start', type: 'date' },
  { key: 'end_date', label: 'End', type: 'date' },
  { key: 'goal_lbs', label: 'Goal (lbs)', type: 'number' },
  { key: 'collected_lbs', label: 'Collected (lbs)', type: 'number' },
  { key: 'status', label: 'Status', badge: true },
];

const formFields = [
  { key: 'name', label: 'Drive Name', placeholder: 'e.g., Holiday Food Drive 2026' },
  { key: 'organizer', label: 'Organizer', placeholder: 'Organization or person' },
  { key: 'start_date', label: 'Start Date', type: 'date' },
  { key: 'end_date', label: 'End Date', type: 'date' },
  { key: 'goal_lbs', label: 'Goal (lbs)', type: 'number' },
  { key: 'collected_lbs', label: 'Collected (lbs)', type: 'number', default: '0' },
  { key: 'location', label: 'Location', placeholder: 'Collection site address' },
  { key: 'status', label: 'Status', type: 'select', options: ['planned', 'active', 'completed'] },
  { key: 'donation_count', label: 'Donation Count', type: 'number', default: '0' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

export default function FoodDrives({ onLogout }) {
  return <CrudPage title="Food Drives" apiPath="/food-drives" columns={columns} formFields={formFields} onLogout={onLogout} />;
}
