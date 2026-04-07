import React from 'react';
import { ObservableState } from '../types';

interface MetricsDisplayProps {
  state: ObservableState | null;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ state }) => {
  if (!state) {
    return (
      <div style={styles.container}>
        <p style={styles.placeholder}>Environment not initialized. Click "Reset" to start.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    normal: '#10b981',
    warning: '#f59e0b',
    critical: '#ef4444',
    recovering: '#06b6d4',
  };

  const renderMetricBar = (label: string, value: number, max: number, unit: string = '') => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
      <div style={styles.metricRow}>
        <div style={styles.metricLabel}>{label}</div>
        <div style={styles.barContainer}>
          <div
            style={{
              ...styles.barFill,
              width: `${percentage}%`,
              backgroundColor: percentage > 80 ? '#ef4444' : percentage > 50 ? '#f59e0b' : '#10b981',
            }}
          />
        </div>
        <div style={styles.metricValue}>
          {value.toFixed(2)}{unit}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.statusBadge}>
        <div
          style={{
            ...styles.statusDot,
            backgroundColor: statusColors[state.status] || '#6b7280',
          }}
        />
        <span style={styles.statusText}>{state.status.toUpperCase()}</span>
      </div>

      <div style={styles.metricsGrid}>
        {renderMetricBar('Latency', state.latency, 2000, 'ms')}
        {renderMetricBar('Error Rate', state.error_rate * 100, 100, '%')}
        {renderMetricBar('Throughput', state.throughput, 1000, ' req/s')}
        {renderMetricBar('CPU Load', state.cpu_load * 100, 100, '%')}
      </div>

      <div style={styles.detailsGrid}>
        <div style={styles.detailCard}>
          <div style={styles.detailLabel}>Latency</div>
          <div style={styles.detailValue}>{state.latency.toFixed(0)}ms</div>
        </div>
        <div style={styles.detailCard}>
          <div style={styles.detailLabel}>Error Rate</div>
          <div style={styles.detailValue}>{(state.error_rate * 100).toFixed(2)}%</div>
        </div>
        <div style={styles.detailCard}>
          <div style={styles.detailLabel}>Throughput</div>
          <div style={styles.detailValue}>{state.throughput.toFixed(0)} req/s</div>
        </div>
        <div style={styles.detailCard}>
          <div style={styles.detailLabel}>CPU Load</div>
          <div style={styles.detailValue}>{(state.cpu_load * 100).toFixed(2)}%</div>
        </div>
      </div>
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
  placeholder: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: '14px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
  statusText: {
    color: '#e5e7eb',
    fontWeight: '600',
    fontSize: '14px',
  },
  metricsGrid: {
    display: 'grid',
    gap: '12px',
    marginBottom: '20px',
  },
  metricRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  metricLabel: {
    color: '#9ca3af',
    fontSize: '12px',
    fontWeight: '500',
    minWidth: '100px',
  },
  barContainer: {
    flex: 1,
    height: '6px',
    backgroundColor: '#374151',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'all 0.3s ease',
  },
  metricValue: {
    color: '#e5e7eb',
    fontSize: '12px',
    fontWeight: '600',
    minWidth: '60px',
    textAlign: 'right',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  },
  detailCard: {
    backgroundColor: '#111827',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #374151',
  },
  detailLabel: {
    color: '#9ca3af',
    fontSize: '12px',
    marginBottom: '4px',
  },
  detailValue: {
    color: '#10b981',
    fontSize: '18px',
    fontWeight: 'bold',
  },
};

export default MetricsDisplay;
