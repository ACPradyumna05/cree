import React from 'react';
import { HistoryEntry } from '../types';

interface HistoryLogProps {
  entries: HistoryEntry[];
  maxHeight?: string;
}

const HistoryLog: React.FC<HistoryLogProps> = ({ entries, maxHeight = '400px' }) => {
  const statusColors: Record<string, string> = {
    normal: '#86bfd8',
    warning: '#8e7fb7',
    critical: '#b87083',
    recovering: '#9ec1e6',
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
                          color: entry.reward >= 0 ? '#86bfd8' : '#b87083',
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
    background: 'linear-gradient(165deg, rgba(13, 21, 39, 0.9), rgba(8, 15, 31, 0.9))',
    backdropFilter: 'blur(6px)',
    borderRadius: '8px',
    border: '1px solid rgba(97, 150, 208, 0.22)',
    boxShadow: '0 0 0 1px rgba(88, 136, 186, 0.08), 0 14px 30px rgba(3, 7, 18, 0.6)',
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
    backgroundColor: 'rgba(7, 15, 30, 0.86)',
    borderRadius: '6px',
    border: '1px solid rgba(94, 138, 188, 0.28)',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  step: {
    color: '#9ec1e6',
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
    color: '#9ec1e6',
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
    background: 'linear-gradient(135deg, #7d4454, #68384a)',
    color: '#dfc4cb',
    fontSize: '11px',
    fontWeight: 'bold',
    borderRadius: '4px',
    textAlign: 'center',
    boxShadow: '0 0 12px rgba(133, 77, 95, 0.28)',
  },
};

export default HistoryLog;
