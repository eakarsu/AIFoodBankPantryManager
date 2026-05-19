import React from 'react';
import Layout from '../components/Layout';
import InventoryFlowChart from '../components/InventoryFlowChart';
import DonorSourceHeatmap from '../components/DonorSourceHeatmap';
import MonthlyInventoryReport from '../components/MonthlyInventoryReport';
import IntakeRulesEditor from '../components/IntakeRulesEditor';

export default function CustomViewsPage({ onLogout }) {
  return (
    <Layout title="Pantry Views" onLogout={onLogout}>
      <div data-testid="custom-views-page" style={{ display: 'grid', gap: 16 }}>
        <InventoryFlowChart />
        <DonorSourceHeatmap />
        <MonthlyInventoryReport />
        <IntakeRulesEditor />
      </div>
    </Layout>
  );
}
