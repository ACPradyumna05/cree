import React, { useState } from 'react';
import CREEClient from './api';
import Dashboard from './components/Dashboard';
import IncidentForm from './components/IncidentForm';
import Dither from './components/Dither';
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
    <div style={styles.appRoot}>
      <div style={styles.cssFallbackLayer} />

      <div style={styles.backgroundLayer}>
        <Dither
          waveColor={[0.2, 0.65, 1.0]}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.35}
          colorNum={6}
          waveAmplitude={0.34}
          waveFrequency={2.2}
          waveSpeed={0.035}
        />
      </div>

      <div style={styles.contentLayer}>
        {!projectCreated ? (
          <IncidentForm client={client} onIncidentCreated={handleIncidentCreated} />
        ) : (
          <Dashboard initialSessionId={sessionId} onResetToIncident={handleResetToIncident} />
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appRoot: {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundLayer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    opacity: 0.95,
  },
  cssFallbackLayer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    background:
      'radial-gradient(circle at 20% 20%, rgba(40, 126, 255, 0.2), transparent 40%), radial-gradient(circle at 80% 15%, rgba(71, 216, 255, 0.15), transparent 45%), linear-gradient(180deg, #091328 0%, #071024 70%, #060d1f 100%)',
  },
  contentLayer: {
    position: 'relative',
    zIndex: 2,
  },
};

export default App;
