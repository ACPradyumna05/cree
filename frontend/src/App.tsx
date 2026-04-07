import React, { useState } from 'react';
import CREEClient from './api';
import Dashboard from './components/Dashboard';
import IncidentForm from './components/IncidentForm';
import { IncidentScenarioResponse } from './types';
import './App.css';

function App() {
  const [client] = useState(() => new CREEClient());
  const [projectCreated, setProjectCreated] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleIncidentCreated = (response: IncidentScenarioResponse) => {
    setSessionId(response.session_id);
    setProjectCreated(true);
  };

  const handleResetToIncident = () => {
    setProjectCreated(false);
    setSessionId(null);
    client.setCurrentSession(null);
  };

  return (
    <div>
      {!projectCreated ? (
        <IncidentForm client={client} onIncidentCreated={handleIncidentCreated} />
      ) : (
        <Dashboard initialSessionId={sessionId} onResetToIncident={handleResetToIncident} />
      )}
    </div>
  );
}

export default App;
