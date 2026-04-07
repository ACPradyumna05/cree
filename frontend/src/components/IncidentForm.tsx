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
        <div style={styles.eyebrow}>Scenario Intake</div>
        <h2 style={styles.title}>Incident Report Analyzer</h2>
        <p style={styles.description}>
          Paste your incident report or system log below. We'll analyze it and create an interactive scenario to help you practice incident response.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formMetaRow}>
            <span style={styles.formHint}>Include latency, error rate, CPU, and cascade symptoms.</span>
            <span style={styles.charCount}>{incidentText.trim().length} chars</span>
          </div>

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
            {loading ? 'Analyzing Report...' : 'Generate Training Scenario'}
          </button>
        </form>

        <div style={styles.examplesSection}>
          <h3 style={styles.examplesTitle}>Use a quick template</h3>
          <div style={styles.examplesList}>
            <button
              type="button"
              onClick={() => setIncidentText('Production alert: Payment service latency increased from 100ms to 2000ms. Error rate went from 0.1% to 5%. Throughput dropped by 60%. Database CPU at 95%.')}
              style={styles.exampleButton}
            >
              <span style={styles.exampleTitle}>High Latency + DB Overload</span>
              <span style={styles.exampleDesc}>Traffic slowdown, rising errors, saturated database.</span>
            </button>
            <button
              type="button"
              onClick={() => setIncidentText('CRITICAL: Cascading failure detected. API Gateway started returning 503s. Load balanced to 5 instances but all hit resource limits. Heartbeat checks failing. All downstream services affected.')}
              style={styles.exampleButton}
            >
              <span style={styles.exampleTitle}>Cascading Failure</span>
              <span style={styles.exampleDesc}>Service chain collapse triggered by upstream failure.</span>
            </button>
            <button
              type="button"
              onClick={() => setIncidentText('Memory leak suspected. App instances restarting automatically. Requests queuing up. Error rate at 8%. Metrics show memory usage at 98% capacity.')}
              style={styles.exampleButton}
            >
              <span style={styles.exampleTitle}>Memory Leak + Restart Loop</span>
              <span style={styles.exampleDesc}>Resource exhaustion with repeated restarts under load.</span>
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
    backgroundColor: 'transparent',
    minHeight: '100vh',
    fontFamily: '"Trebuchet MS", "Segoe UI", "Roboto", sans-serif',
  },
  card: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '34px',
    background: 'linear-gradient(165deg, rgba(13, 21, 39, 0.9), rgba(8, 15, 31, 0.92))',
    backdropFilter: 'blur(6px)',
    borderRadius: '16px',
    border: '1px solid rgba(97, 150, 208, 0.25)',
    boxShadow: '0 0 0 1px rgba(91, 140, 192, 0.1), 0 22px 52px rgba(3, 7, 18, 0.74), inset 0 1px 0 rgba(106, 170, 235, 0.12)',
  },
  eyebrow: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#9dc4e8',
    backgroundColor: 'rgba(26, 58, 96, 0.35)',
    border: '1px solid rgba(106, 152, 205, 0.3)',
    marginBottom: '10px',
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '34px',
    fontWeight: 'bold',
    letterSpacing: '0.01em',
    color: '#9cc9f1',
    textShadow: '0 0 12px rgba(93, 157, 214, 0.22)',
  },
  description: {
    margin: '0 0 22px 0',
    fontSize: '15px',
    color: '#a9bbd3',
    lineHeight: '1.6',
    maxWidth: '62ch',
  },
  form: {
    marginBottom: '24px',
  },
  formMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    gap: '12px',
  },
  formHint: {
    color: '#8ea7c6',
    fontSize: '12px',
    letterSpacing: '0.02em',
  },
  charCount: {
    color: '#6d98c2',
    fontSize: '12px',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap' as const,
  },
  textarea: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'rgba(4, 14, 32, 0.94)',
    color: '#c8d8ea',
    border: '1px solid rgba(91, 139, 190, 0.35)',
    borderRadius: '10px',
    fontSize: '14px',
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
    padding: '13px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '0.02em',
  },
  buttonPrimary: {
    background: 'linear-gradient(135deg, #253b77, #352f67)',
    color: '#c8d7e8',
    border: '1px solid rgba(92, 133, 183, 0.4)',
    boxShadow: 'inset 0 0 12px rgba(129, 173, 222, 0.12), 0 0 14px rgba(53, 78, 141, 0.25)',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  examplesSection: {
    marginTop: '22px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(90, 128, 170, 0.26)',
  },
  examplesTitle: {
    margin: '0 0 14px 0',
    fontSize: '13px',
    fontWeight: '600',
    color: '#8da6c2',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  examplesList: {
    display: 'grid',
    gap: '10px',
  },
  exampleButton: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '11px 13px',
    backgroundColor: 'rgba(36, 49, 74, 0.82)',
    color: '#c7d8ed',
    border: '1px solid rgba(94, 138, 188, 0.3)',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left' as const,
  },
  exampleTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#ccdef2',
  },
  exampleDesc: {
    fontSize: '11px',
    color: '#89a3c0',
    lineHeight: 1.4,
  },
};

export default IncidentForm;
