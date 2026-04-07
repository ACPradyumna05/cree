import React, { useState } from 'react';
import CREEClient from '../api';
import { IncidentScenarioResponse } from '../types';

interface IncidentFormProps {
  client: CREEClient;
  onIncidentCreated: (response: IncidentScenarioResponse) => void;
  disabled?: boolean;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ client, onIncidentCreated, disabled = false }) => {
  const [incidentText, setIncidentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentText.trim()) {
      setError('Please enter an incident report');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await client.submitIncident(incidentText);
      setIncidentText('');
      onIncidentCreated(response);
    } catch (err) {
      setError(`Failed to analyze incident: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Incident Report Analyzer</h2>
        <p style={styles.description}>
          Paste your incident report or system log below. We'll analyze it and create an interactive scenario to help you practice incident response.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <textarea
            value={incidentText}
            onChange={(e) => setIncidentText(e.target.value)}
            placeholder="Paste incident report here... e.g., 'Production alert: API latency increased to 5000ms, error rate jumped to 15%, 3 services timing out...'"
            style={styles.textarea}
            disabled={disabled || loading}
            rows={6}
          />

          {error && <div style={styles.errorBanner}>{error}</div>}

          <button
            type="submit"
            disabled={disabled || loading || !incidentText.trim()}
            style={{
              ...styles.button,
              ...styles.buttonPrimary,
              ...(disabled || loading || !incidentText.trim() ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze Incident'}
          </button>
        </form>

        <div style={styles.examplesSection}>
          <h3 style={styles.examplesTitle}>Example incident reports:</h3>
          <div style={styles.examplesList}>
            <button
              type="button"
              onClick={() => setIncidentText('Production alert: Payment service latency increased from 100ms to 2000ms. Error rate went from 0.1% to 5%. Throughput dropped by 60%. Database CPU at 95%.')}
              style={styles.exampleButton}
            >
              High Latency + DB Overload
            </button>
            <button
              type="button"
              onClick={() => setIncidentText('CRITICAL: Cascading failure detected. API Gateway started returning 503s. Load balanced to 5 instances but all hit resource limits. Heartbeat checks failing. All downstream services affected.')}
              style={styles.exampleButton}
            >
              Cascading Failure
            </button>
            <button
              type="button"
              onClick={() => setIncidentText('Memory leak suspected. App instances restarting automatically. Requests queuing up. Error rate at 8%. Metrics show memory usage at 98% capacity.')}
              style={styles.exampleButton}
            >
              Memory Leak + Restart Loop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    backgroundColor: '#111827',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  },
  card: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '32px',
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    border: '1px solid #374151',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#06b6d4',
  },
  description: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: '#d1d5db',
    lineHeight: '1.6',
  },
  form: {
    marginBottom: '24px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#111827',
    color: '#e5e7eb',
    border: '1px solid #374151',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'monospace',
    lineHeight: '1.5',
    boxSizing: 'border-box',
    marginBottom: '16px',
    resize: 'vertical' as const,
  },
  errorBanner: {
    padding: '12px',
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px',
    border: '1px solid #991b1b',
  },
  button: {
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  buttonPrimary: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  examplesSection: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #374151',
  },
  examplesTitle: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  examplesList: {
    display: 'grid',
    gap: '8px',
  },
  exampleButton: {
    padding: '10px 12px',
    backgroundColor: '#374151',
    color: '#d1d5db',
    border: '1px solid #4b5563',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left' as const,
  },
};

export default IncidentForm;
