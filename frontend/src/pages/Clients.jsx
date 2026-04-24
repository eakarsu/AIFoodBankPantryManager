import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'city', label: 'City' },
  { key: 'household_size', label: 'Household', type: 'number' },
  { key: 'income_level', label: 'Income', badge: true },
  { key: 'is_homebound', label: 'Homebound', type: 'boolean' },
];

const formFields = [
  { key: 'first_name', label: 'First Name', placeholder: 'John' },
  { key: 'last_name', label: 'Last Name', placeholder: 'Doe' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
  { key: 'phone', label: 'Phone', placeholder: '(555) 123-4567' },
  { key: 'address', label: 'Address', placeholder: '123 Main St', fullWidth: true },
  { key: 'city', label: 'City', placeholder: 'Springfield' },
  { key: 'state', label: 'State', placeholder: 'IL' },
  { key: 'zip', label: 'Zip Code', placeholder: '62701' },
  { key: 'household_size', label: 'Household Size', type: 'number', default: '1' },
  { key: 'income_level', label: 'Income Level', type: 'select', options: ['below-poverty', 'low', 'moderate'] },
  { key: 'dietary_restrictions', label: 'Dietary Restrictions', type: 'textarea', fullWidth: true, placeholder: 'e.g., diabetic, gluten-free, halal...' },
  { key: 'is_homebound', label: 'Homebound', type: 'checkbox', checkLabel: 'Client is homebound and needs delivery' },
  { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
];

export default function Clients({ onLogout }) {
  return <CrudPage title="Clients" apiPath="/clients" columns={columns} formFields={formFields} onLogout={onLogout} />;
}
