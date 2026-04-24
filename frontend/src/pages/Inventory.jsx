import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Item Name' },
  { key: 'category', label: 'Category', badge: true },
  { key: 'quantity', label: 'Qty', type: 'number' },
  { key: 'weight_lbs', label: 'Weight (lbs)', type: 'number' },
  { key: 'storage_type', label: 'Storage', badge: true },
  { key: 'expiration_date', label: 'Expires', type: 'date' },
  { key: 'status', label: 'Status', badge: true },
];

const formFields = [
  { key: 'name', label: 'Item Name', placeholder: 'e.g., Canned Soup' },
  { key: 'category', label: 'Category', type: 'select', options: ['protein', 'dairy', 'produce', 'grain', 'canned', 'beverage', 'snack', 'condiment'] },
  { key: 'source', label: 'Source', type: 'select', options: ['donated', 'purchased', 'usda'] },
  { key: 'quantity', label: 'Quantity', type: 'number', default: '0' },
  { key: 'unit', label: 'Unit', type: 'select', options: ['units', 'lbs', 'cases', 'pallets', 'gallons', 'dozen'] },
  { key: 'weight_lbs', label: 'Weight (lbs)', type: 'number' },
  { key: 'expiration_date', label: 'Expiration Date', type: 'date' },
  { key: 'storage_type', label: 'Storage Type', type: 'select', options: ['shelf', 'cooler', 'freezer'] },
  { key: 'warehouse_id', label: 'Warehouse ID', type: 'number' },
  { key: 'barcode', label: 'Barcode', placeholder: 'Scan or enter barcode' },
  { key: 'min_stock_level', label: 'Min Stock Level', type: 'number', default: '0' },
  { key: 'status', label: 'Status', type: 'select', options: ['available', 'reserved', 'expired', 'distributed'] },
];

export default function Inventory({ onLogout }) {
  return <CrudPage title="Inventory" apiPath="/inventory" columns={columns} formFields={formFields} onLogout={onLogout} />;
}
