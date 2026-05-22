import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Visits from './pages/Visits';
import Inventory from './pages/Inventory';
import Distributions from './pages/Distributions';
import Donors from './pages/Donors';
import FoodDrives from './pages/FoodDrives';
import Volunteers from './pages/Volunteers';
import DeliveryRoutes from './pages/DeliveryRoutes';
import Warehouses from './pages/Warehouses';
import Partners from './pages/Partners';
import Grants from './pages/Grants';
import Donations from './pages/Donations';
import Fleet from './pages/Fleet';
import AITools from './pages/AITools';
import AIAdvancedTools from './pages/AIAdvancedTools';
import AIHistory from './pages/AIHistory';

import Batch03Features from './pages/Batch03Features';
import CustomViewsPage from './pages/CustomViewsPage';
import PantryAllocationPlanner from './pages/PantryAllocationPlanner';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

          <Route path="/batch03" element={<Batch03Features />} />
        <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
        <Route path="/clients" element={<Clients onLogout={handleLogout} />} />
        <Route path="/visits" element={<Visits onLogout={handleLogout} />} />
        <Route path="/inventory" element={<Inventory onLogout={handleLogout} />} />
        <Route path="/distributions" element={<Distributions onLogout={handleLogout} />} />
        <Route path="/donors" element={<Donors onLogout={handleLogout} />} />
        <Route path="/food-drives" element={<FoodDrives onLogout={handleLogout} />} />
        <Route path="/volunteers" element={<Volunteers onLogout={handleLogout} />} />
        <Route path="/delivery-routes" element={<DeliveryRoutes onLogout={handleLogout} />} />
        <Route path="/warehouses" element={<Warehouses onLogout={handleLogout} />} />
        <Route path="/partners" element={<Partners onLogout={handleLogout} />} />
        <Route path="/grants" element={<Grants onLogout={handleLogout} />} />
        <Route path="/donations" element={<Donations onLogout={handleLogout} />} />
        <Route path="/fleet" element={<Fleet onLogout={handleLogout} />} />
        <Route path="/ai-tools" element={<AITools onLogout={handleLogout} />} />
        <Route path="/ai-advanced-tools" element={<AIAdvancedTools onLogout={handleLogout} />} />
        <Route path="/ai-history" element={<AIHistory onLogout={handleLogout} />} />
        <Route path="/custom-views" element={<CustomViewsPage onLogout={handleLogout} />} />
        <Route path="/pantry-allocation" element={<PantryAllocationPlanner onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
