import React, { useState } from 'react';
import { ActionDefinition } from '../types';

interface ActionButtonsProps {
  actions: ActionDefinition[];
  onAction: (action: string) => void;
  disabled: boolean;
  loading: string | null;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ actions, onAction, disabled, loading }) => {
  const [filter, setFilter] = useState<string>('');

  const uniqueCategories = Array.from(new Set(actions.map((a) => a.category)));
  const filteredActions = filter
    ? actions.filter((a) => a.category === filter)
    : actions;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Available Actions</h3>

      <div style={styles.filterButtons}>
        {uniqueCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(filter === cat ? '' : cat)}
            style={{
              ...styles.filterBtn,
              ...(filter === cat ? styles.filterBtnActive : {}),
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={styles.actionGrid}>
        {filteredActions.map((action) => (
          <button
            key={action.name}
            onClick={() => onAction(action.name)}
            disabled={disabled || loading !== null}
            title={action.description}
            style={{
              ...styles.actionBtn,
              ...(disabled || loading !== null ? styles.actionBtnDisabled : {}),
              ...(loading === action.name ? styles.actionBtnLoading : {}),
            }}
          >
            <div style={styles.actionName}>{action.name}</div>
            <div style={styles.actionDesc}>{action.description}</div>
          </button>
        ))}
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
  title: {
    color: '#e5e7eb',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '16px',
    margin: 0,
  },
  filterButtons: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '6px 12px',
    backgroundColor: '#374151',
    color: '#d1d5db',
    border: '1px solid #4b5563',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  filterBtnActive: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    borderColor: '#818cf8',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '10px',
  },
  actionBtn: {
    padding: '12px 10px',
    backgroundColor: '#374151',
    color: '#e5e7eb',
    border: '1px solid #4b5563',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  actionBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '#1f2937',
  },
  actionBtnLoading: {
    backgroundColor: '#6366f1',
    borderColor: '#818cf8',
    boxShadow: '0 0 8px rgba(99, 102, 241, 0.5)',
  },
  actionName: {
    fontWeight: 'bold',
    marginBottom: '4px',
    color: '#10b981',
  },
  actionDesc: {
    fontSize: '11px',
    color: '#9ca3af',
    lineHeight: '1.3',
  },
};

export default ActionButtons;
