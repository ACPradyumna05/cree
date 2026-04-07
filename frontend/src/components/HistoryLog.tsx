import React from 'react';
import { HistoryEntry } from '../types';

interface HistoryLogProps {
  entries: HistoryEntry[];
  maxHeight?: string;
}

const HistoryLog: React.FC<HistoryLogProps> = ({ entries, maxHeight = '400px' }) => {
  const statusColors: Record<string, string> = {
    normal: '#10b981',
    warning: '#f59e0b',
    critical: '#ef4444',
    recovering: '#06b6d4',
  };

  return (
    <div style={{ ...styles.container, maxHeight, overflowY: 'auto' }}>
      <h3 style={styles.title}>Episode History</h3>
      {entries.length === 0 ? (
        <div style={styles.empty}>No actions taken yet</div>
      ) : (
        <div style={styles.logList}>
          {entries
            .slice()
            .reverse()
            .map((entry, idx) => (
              <div key={idx} style={styles.logEntry}>
                <div style={styles.logHeader}>
                  <span style={styles.step}>Step {entry.step}</span>
                  <span style={styles.time}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={styles.logBody}>
                  <div style={styles.action}>
                    <span style={styles.actionLabel}>Action:</span>
                    <span style={styles.actionValue}>{entry.action}</span>
                  </div>
                  <div style={styles.row}>
                    <div style={styles.metric}>
                      <span style={styles.metricLabel}>Status:</span>
                      <span
                        style={{
                          ...styles.metricValue,
                          color: statusColors[entry.state.status] || '#6b7280',
                        }}
                      >
                        {entry.state.status}
                      </span>
                    </div>
                    <div style={styles.metric}>
                      <span style={styles.metricLabel}>Reward:</span>
                      <span
                        style={{
                          ...styles.metricValue,
                          color: entry.reward >= 0 ? '#10b981' : '#ef4444',
                        }}
                      >
                        {entry.reward.toFixed(2)}
                      </span>
                    </div>
                    <div style={styles.metric}>
                      <span style={styles.metricLabel}>Latency:</span>
                      <span style={styles.metricValue}>{entry.state.latency.toFixed(0)}ms</span>
                    </div>
                  </div>
                  <div style={styles.row}>
                    <div style={styles.metric}>
                      <span style={styles.metricLabel}>Error Rate:</span>
                      <span style={styles.metricValue}>
                        {(entry.state.error_rate * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div style={styles.metric}>
                      <span style={styles.metricLabel}>Throughput:</span>
                      <span style={styles.metricValue}>
                        {entry.state.throughput.toFixed(0)} req/s
                      </span>
                    </div>
                    <div style={styles.metric}>
                      <span style={styles.metricLabel}>CPU:</span>
                      <span style={styles.metricValue}>
                        {(entry.state.cpu_load * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                {entry.done && <div style={styles.episodeDone}>Episode Ended</div>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    border: '1px solid #374151',
  },
  title: {
    color: '#e5e7eb',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '16px',
    margin: 0,
  },
  empty: {
    color: '#9ca3af',
    textAlign: 'center',
    padding: '20px',
  },
  logList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  logEntry: {
    padding: '12px',
    backgroundColor: '#111827',
    borderRadius: '6px',
    border: '1px solid #374151',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  step: {
    color: '#818cf8',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  time: {
    color: '#6b7280',
    fontSize: '11px',
  },
  logBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  action: {
    display: 'flex',
    gap: '8px',
  },
  actionLabel: {
    color: '#9ca3af',
    fontSize: '12px',
    fontWeight: '500',
  },
  actionValue: {
    color: '#10b981',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metricLabel: {
    color: '#6b7280',
    fontSize: '11px',
  },
  metricValue: {
    color: '#e5e7eb',
    fontSize: '12px',
    fontWeight: '600',
  },
  episodeDone: {
    marginTop: '8px',
    padding: '6px 8px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 'bold',
    borderRadius: '4px',
    textAlign: 'center',
  },
};

export default HistoryLog;
