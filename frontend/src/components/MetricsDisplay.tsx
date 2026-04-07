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
    normal: '#86bfd8',
    warning: '#8e7fb7',
    critical: '#b87083',
    recovering: '#9ec1e6',
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
              backgroundColor: percentage > 80 ? '#b87083' : percentage > 50 ? '#8e7fb7' : '#86bfd8',
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
    background: 'linear-gradient(165deg, rgba(13, 21, 39, 0.9), rgba(8, 15, 31, 0.9))',
    backdropFilter: 'blur(6px)',
    borderRadius: '8px',
    border: '1px solid rgba(97, 150, 208, 0.22)',
    boxShadow: '0 0 0 1px rgba(88, 136, 186, 0.08), 0 14px 30px rgba(3, 7, 18, 0.6)',
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
    color: '#b2c3d8',
    fontWeight: '600',
    fontSize: '14px',
    textShadow: '0 0 10px rgba(93, 157, 214, 0.2)',
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
    backgroundColor: 'rgba(56, 68, 90, 0.85)',
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
    backgroundColor: 'rgba(7, 15, 30, 0.86)',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid rgba(94, 138, 188, 0.28)',
  },
  detailLabel: {
    color: '#9ca3af',
    fontSize: '12px',
    marginBottom: '4px',
  },
  detailValue: {
    color: '#9ec1e6',
    fontSize: '18px',
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(93, 157, 214, 0.2)',
  },
};

export default MetricsDisplay;
