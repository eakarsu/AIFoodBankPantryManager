import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, ClipboardList, Package, Calendar, Heart, Megaphone, UserCheck, Truck, Warehouse, Handshake, FileText, DollarSign, Car, LayoutDashboard, Bot, History, LogOut, Sparkles } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/visits', label: 'Visit Tracking', icon: ClipboardList },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/distributions', label: 'Distributions', icon: Calendar },
  { path: '/donors', label: 'Donors', icon: Heart },
  { path: '/food-drives', label: 'Food Drives', icon: Megaphone },
  { path: '/volunteers', label: 'Volunteers', icon: UserCheck },
  { path: '/delivery-routes', label: 'Delivery Routes', icon: Truck },
  { path: '/warehouses', label: 'Warehouses', icon: Warehouse },
  { path: '/partners', label: 'Partners', icon: Handshake },
  { path: '/grants', label: 'Grants', icon: FileText },
  { path: '/donations', label: 'Donations', icon: DollarSign },
  { path: '/fleet', label: 'Fleet', icon: Car },
  { path: '/ai-tools', label: 'AI Tools', icon: Bot },
  { path: '/ai-advanced-tools', label: 'AI Advanced', icon: Sparkles },
  { path: '/ai-history', label: 'AI History', icon: History },
];

export default function Layout({ children, title, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <span className="logo-icon">🏦</span>
          <span className="logo-text">FoodBank AI</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="nav-item" onClick={onLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="page-header">
          <h1>{title}</h1>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
