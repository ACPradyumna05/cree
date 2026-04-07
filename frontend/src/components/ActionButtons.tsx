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
  filterButtons: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '6px 12px',
    backgroundColor: 'rgba(36, 49, 74, 0.82)',
    color: '#c7d8ed',
    border: '1px solid rgba(94, 138, 188, 0.3)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    outline: 'none',
    appearance: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  filterBtnActive: {
    background: 'linear-gradient(135deg, #253b77, #352f67)',
    color: '#c8d7e8',
    borderColor: 'rgba(124, 165, 209, 0.46)',
    boxShadow: '0 0 0 1px rgba(124, 165, 209, 0.18), 0 0 14px rgba(80, 110, 148, 0.2)',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '10px',
  },
  actionBtn: {
    padding: '12px 10px',
    backgroundColor: 'rgba(36, 49, 74, 0.82)',
    color: '#c7d8ed',
    border: '1px solid rgba(94, 138, 188, 0.3)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    outline: 'none',
    appearance: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  actionBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: 'rgba(29, 41, 63, 0.8)',
  },
  actionBtnLoading: {
    background: 'linear-gradient(135deg, #253b77, #352f67)',
    borderColor: 'rgba(124, 165, 209, 0.46)',
    boxShadow: '0 0 0 1px rgba(124, 165, 209, 0.22), 0 0 16px rgba(80, 110, 148, 0.25)',
  },
  actionName: {
    fontWeight: 'bold',
    marginBottom: '4px',
    color: '#9ec1e6',
  },
  actionDesc: {
    fontSize: '11px',
    color: '#9ca3af',
    lineHeight: '1.3',
  },
};

export default ActionButtons;
