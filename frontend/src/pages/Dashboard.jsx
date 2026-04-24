import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

const featureCards = [
  { path: '/clients', icon: '👥', title: 'Client Registration', desc: 'Manage client profiles, household info & dietary needs', color: '#2d6a4f' },
  { path: '/visits', icon: '📋', title: 'Visit Tracking', desc: 'Track client visits, frequency limits & distribution type', color: '#40916c' },
  { path: '/inventory', icon: '📦', title: 'Inventory Management', desc: 'Food categorization, FIFO rotation & stock levels', color: '#52b788' },
  { path: '/distributions', icon: '📅', title: 'Distribution Scheduling', desc: 'Shopping-style, pre-packed boxes & mobile pantry', color: '#264653' },
  { path: '/donors', icon: '❤️', title: 'Donor Management', desc: 'Individuals, corporations & grocery partners', color: '#e76f51' },
  { path: '/food-drives', icon: '📢', title: 'Food Drives', desc: 'Drive tracking, goals & collection progress', color: '#e9c46a' },
  { path: '/volunteers', icon: '🙋', title: 'Volunteer Scheduling', desc: 'Hours tracking, skills & background checks', color: '#f4a261' },
  { path: '/delivery-routes', icon: '🚚', title: 'Delivery Routes', desc: 'Homebound client delivery management', color: '#2a9d8f' },
  { path: '/warehouses', icon: '🏭', title: 'Warehouse Locations', desc: 'Temperature monitoring & capacity management', color: '#457b9d' },
  { path: '/partners', icon: '🤝', title: 'Partner Agencies', desc: 'Other pantries, shelters & community centers', color: '#1d3557' },
  { path: '/grants', icon: '📄', title: 'Grant Tracking', desc: 'Applications, awards & compliance reporting', color: '#6d6875' },
  { path: '/donations', icon: '💰', title: 'Financial Donations', desc: 'Donation tracking & tax receipt generation', color: '#b5838d' },
  { path: '/fleet', icon: '🚗', title: 'Fleet Management', desc: 'Vehicles, maintenance & capacity tracking', color: '#e5989b' },
  { path: '/ai-tools', icon: '🤖', title: 'AI Tools', desc: 'AI-powered analysis, predictions & content generation', color: '#7209b7' },
];

export default function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Total Clients', value: stats.total_clients, icon: '👥', color: '#2d6a4f' },
    { label: 'Visits This Month', value: stats.total_visits_this_month, icon: '📋', color: '#40916c' },
    { label: 'Inventory (lbs)', value: Number(stats.total_inventory_lbs || 0).toLocaleString(), icon: '📦', color: '#264653' },
    { label: 'Active Volunteers', value: stats.total_volunteers, icon: '🙋', color: '#f4a261' },
    { label: 'Upcoming Events', value: stats.upcoming_distributions, icon: '📅', color: '#2a9d8f' },
    { label: 'Active Donors', value: stats.active_donors, icon: '❤️', color: '#e76f51' },
    { label: 'Grants Value', value: `$${Number(stats.active_grants_value || 0).toLocaleString()}`, icon: '📄', color: '#6d6875' },
    { label: 'Donations (Month)', value: `$${Number(stats.total_donations_this_month || 0).toLocaleString()}`, icon: '💰', color: '#b5838d' },
  ] : [];

  return (
    <Layout title="Dashboard" onLogout={onLogout}>
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card" style={{ borderTop: `4px solid ${s.color}` }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{loading ? '...' : s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <h2 style={{ margin: '30px 0 15px', color: 'var(--text)' }}>Management Modules</h2>
      <div className="dashboard-grid">
        {featureCards.map(card => (
          <div key={card.path} className="feature-card" onClick={() => navigate(card.path)} style={{ borderLeft: `4px solid ${card.color}` }}>
            <div className="feature-icon">{card.icon}</div>
            <div className="feature-info">
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
            <div className="feature-arrow">→</div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
