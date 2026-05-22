import React, { useState } from 'react';
import { api } from '../api';

export default function PantryAllocationPlanner() {
  const [payload, setPayload] = useState('{"distribution":"Saturday pantry","households":85,"produce_lbs":920,"protein_lbs":310,"shelf_stable_lbs":760,"homebound_clients":18}');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const run = async () => {
    setError('');
    try { setResult(await api.post('/pantry-allocation/plan', JSON.parse(payload || '{}'))); }
    catch (e) { setError(e.message); }
  };
  return <div className="page"><h1>Pantry Allocation Planner</h1><textarea rows={8} value={payload} onChange={(e) => setPayload(e.target.value)} /><button onClick={run}>Plan Allocation</button>{error && <div>{error}</div>}{result && <pre>{JSON.stringify(result, null, 2)}</pre>}</div>;
}
