import React, { useEffect, useState, useCallback, useRef } from 'react';
import CREEClient from '../api';
import { ObservableState, ActionDefinition, TaskDefinition, HistoryEntry, StepResult, ProjectInfo, MetricUpdate } from '../types';
import MetricsDisplay from './MetricsDisplay';
import ActionButtons from './ActionButtons';
import HistoryLog from './HistoryLog';

interface DashboardProps {
  initialSessionId?: string | null;
  onResetToIncident?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ initialSessionId = null, onResetToIncident }) => {
  const [client] = useState(() => new CREEClient());
  const [state, setState] = useState<ObservableState | null>(null);
  const [actions, setActions] = useState<ActionDefinition[]>([]);
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [episodeDone, setEpisodeDone] = useState(false);
  const [gradeResult, setGradeResult] = useState<Record<string, any> | null>(null);

  // Project/Session state
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [showProjectList, setShowProjectList] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const data = await client.listProjects();
      setProjects(data.projects);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, [client]);

  // Load initial project if provided
  useEffect(() => {
    if (initialSessionId) {
      setSessionId(initialSessionId);
      client.setCurrentSession(initialSessionId);
    }
  }, [initialSessionId, client]);

  // Check connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await client.health();
        setConnected(true);
        const tasksData = await client.getTasks();
        setTasks(tasksData.tasks);
        const actionsData = await client.getActions();
        setActions(actionsData.actions);
        await loadProjects();
      } catch (err) {
        setError(`Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setConnected(false);
      }
    };
    checkConnection();
  }, [client, loadProjects]);

  // Subscribe to WebSocket metrics when session changes
  useEffect(() => {
    // Unsubscribe from previous session
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (sessionId) {
      setWsStatus('connecting');
      // Subscribe to metrics
      unsubscribeRef.current = client.subscribeToMetrics((metric: MetricUpdate) => {
        if (metric.type === 'metric_batch') {
          // Handle batch updates
          metric.updates?.forEach((update) => {
            if (update.observation) {
              setState(update.observation);
            }
          });
        } else if (metric.type === 'metric_update') {
          // Handle individual updates
          if (metric.observation) {
            setState(metric.observation);
          }
        }
      });

      // Check connection status periodically
      const statusCheck = setInterval(() => {
        if (client.isWebSocketConnected()) {
          setWsStatus('connected');
        } else {
          setWsStatus(client.getWebSocketStatus() === 'closed' ? 'disconnected' : 'connecting');
        }
      }, 500);

      return () => clearInterval(statusCheck);
    }
  }, [sessionId, client]);

  const handleCreateProject = useCallback(async () => {
    try {
      const response = await client.createProject(selectedTask);
      setSessionId(response.session_id);
      client.setCurrentSession(response.session_id);
      setState(null);
      setHistory([]);
      setStepCount(0);
      setTotalReward(0);
      setEpisodeDone(false);
      setGradeResult(null);
      setError(null);
      await loadProjects();
    } catch (err) {
      setError(`Failed to create project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [client, selectedTask, loadProjects]);

  const handleSwitchProject = useCallback(async (newSessionId: string) => {
    setSessionId(newSessionId);
    client.setCurrentSession(newSessionId);
    setHistory([]);
    setStepCount(0);
    setTotalReward(0);
    setEpisodeDone(false);
    setGradeResult(null);
    setShowProjectList(false);
    setError(null);

    // Load initial state
    try {
      const stateData = await client.projectGetState(newSessionId);
      setState(stateData.state || stateData.observation);
    } catch (err) {
      // State might not be initialized yet
      setState(null);
    }
  }, [client]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      await client.deleteProject(projectId);
      if (projectId === sessionId) {
        setSessionId(null);
        setState(null);
      }
      await loadProjects();
    } catch (err) {
      setError(`Failed to delete project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [client, sessionId, loadProjects]);

  const handleReset = useCallback(async () => {
    setLoading('reset');
    setError(null);
    try {
      const result = sessionId
        ? await client.projectReset(sessionId, selectedTask)
        : await client.reset(selectedTask);
      setState(result.state);
      setHistory([]);
      setStepCount(0);
      setTotalReward(0);
      setEpisodeDone(false);
      setGradeResult(null);
    } catch (err) {
      setError(`Reset failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  }, [client, sessionId, selectedTask]);

  const handleAction = useCallback(
    async (action: string) => {
      if (!state) return;
      setLoading(action);
      setError(null);
      try {
        const result: StepResult = sessionId
          ? await client.projectStep(sessionId, action)
          : await client.step(action);
        const nextState = result.state || result.observation;
        if (!nextState) {
          throw new Error('No state returned from step response');
        }
        setState(nextState);

        // Add to history
        const entry: HistoryEntry = {
          step: stepCount + 1,
          action,
          timestamp: Date.now(),
          state: nextState,
          reward: result.reward,
          done: result.done,
        };
        setHistory((prev) => [...prev, entry]);
        setStepCount((prev) => prev + 1);
        setTotalReward((prev) => prev + result.reward);

        if (result.done) {
          setEpisodeDone(true);
        }
      } catch (err) {
        setError(`Action failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(null);
      }
    },
    [client, sessionId, state, stepCount]
  );

  const handleGrade = useCallback(async () => {
    setLoading('grade');
    setError(null);
    try {
      const result = sessionId
        ? await client.projectGrade(sessionId)
        : await client.grade();
      setGradeResult(result);
    } catch (err) {
      setError(`Grading failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  }, [client, sessionId]);

  const formatGradeLabel = (key: string): string =>
    key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatGradeValue = (value: unknown): string => {
    if (typeof value === 'number') return Number.isInteger(value) ? `${value}` : value.toFixed(3);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === null || value === undefined) return 'N/A';
    return String(value);
  };

  const renderGradeRows = (data: Record<string, any>) => {
    return Object.entries(data).map(([key, value]) => {
      const label = formatGradeLabel(key);

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = value as Record<string, unknown>;
        return (
          <div key={key} style={styles.gradeGroup}>
            <div style={styles.gradeGroupTitle}>{label}</div>
            {Object.entries(nested).map(([nestedKey, nestedValue]) => (
              <div key={`${key}-${nestedKey}`} style={styles.gradeRow}>
                <span style={styles.gradeKey}>{formatGradeLabel(nestedKey)}</span>
                <span style={styles.gradeValue}>{formatGradeValue(nestedValue)}</span>
              </div>
            ))}
          </div>
        );
      }

      if (Array.isArray(value)) {
        return (
          <div key={key} style={styles.gradeRow}>
            <span style={styles.gradeKey}>{label}</span>
            <span style={styles.gradeValue}>{value.map((v) => formatGradeValue(v)).join(', ') || 'N/A'}</span>
          </div>
        );
      }

      return (
        <div key={key} style={styles.gradeRow}>
          <span style={styles.gradeKey}>{label}</span>
          <span style={styles.gradeValue}>{formatGradeValue(value)}</span>
        </div>
      );
    });
  };

  return (
    <div style={styles.dashboard}>
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <h1 style={styles.title}>CREE Dashboard</h1>
            <p style={styles.subtitle}>Causal Reverse Engineering Engine</p>
          </div>
          <div style={styles.headerStatus}>
            <div style={{ ...styles.statusDot, backgroundColor: connected ? '#5da8dd' : '#9f4f61' }} />
            <span>{connected ? 'API Connected' : 'API Disconnected'}</span>
            <div style={{ ...styles.statusDot, backgroundColor: wsStatus === 'connected' ? '#5da8dd' : wsStatus === 'connecting' ? '#8e7fb7' : '#9f4f61' }} />
            <span>WS {wsStatus}</span>
          </div>
        </div>

        {/* Project Selector */}
        <div style={styles.projectSelector}>
          <button
            onClick={() => setShowProjectList(!showProjectList)}
            style={{...styles.btn, ...styles.btnSmall, ...styles.btnSecondary}}
          >
            Projects ({projects.length})
          </button>
          <button
            onClick={handleCreateProject}
            disabled={!connected || loading !== null}
            style={{...styles.btn, ...styles.btnSmall, ...styles.btnPrimary, ...(!connected || loading !== null ? styles.btnDisabled : {})}}
          >
            New Project
          </button>
          {onResetToIncident && (
            <button
              onClick={onResetToIncident}
              style={{...styles.btn, ...styles.btnSmall, ...styles.btnSecondary}}
            >
              Back to Incident Analysis
            </button>
          )}
          {sessionId && (
            <span style={styles.currentSession}>
              Active: <code style={styles.code}>{sessionId}</code>
            </span>
          )}
        </div>
      </header>

      {/* Project List Modal */}
      {showProjectList && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>All Projects</h3>
              <button onClick={() => setShowProjectList(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.projectList}>
              {projects.length === 0 ? (
                <p style={styles.emptyText}>No projects yet. Create one to get started!</p>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj.session_id}
                    style={{...styles.projectItem, ...(proj.session_id === sessionId ? styles.projectItemActive : {})}}
                    onClick={() => handleSwitchProject(proj.session_id)}
                  >
                    <div style={styles.projectItemInfo}>
                      <div style={styles.projectItemId}>{proj.session_id}</div>
                      <div style={styles.projectItemMeta}>
                        Task: {proj.current_task || 'None'} | Steps: {proj.steps_taken} | Reward: {proj.total_reward.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(proj.session_id);
                      }}
                      style={styles.deleteBtn}
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.main}>
        {/* Left side - Controls */}
        <div style={styles.leftPanel}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Task Selection</h2>
            <select
              value={selectedTask || ''}
              onChange={(e) => setSelectedTask(e.target.value || undefined)}
              style={styles.select}
            >
              <option value="">No task (Free exploration)</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name} ({task.difficulty})
                </option>
              ))}
            </select>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Controls</h2>
            <button
              onClick={handleReset}
              disabled={!connected || loading !== null}
              style={{
                ...styles.btn,
                ...styles.btnPrimary,
                ...(connected && loading === null ? {} : styles.btnDisabled),
              }}
            >
              {loading === 'reset' ? 'Resetting...' : 'Reset Episode'}
            </button>
            <button
              onClick={handleGrade}
              disabled={!connected || loading !== null || !selectedTask}
              style={{
                ...styles.btn,
                ...styles.btnSecondary,
                ...(connected && loading === null && selectedTask ? {} : styles.btnDisabled),
              }}
            >
              {loading === 'grade' ? 'Grading...' : 'Grade Episode'}
            </button>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Episode Stats</h2>
            <div style={styles.statGrid}>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>Steps</div>
                <div style={styles.statValue}>{stepCount}</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>Reward</div>
                <div style={{ ...styles.statValue, color: totalReward >= 0 ? '#86bfd8' : '#b87083' }}>
                  {totalReward.toFixed(2)}
                </div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>Status</div>
                <div style={{
                  ...styles.statValue,
                  color: episodeDone ? '#b87083' : '#86bfd8'
                }}>
                  {episodeDone ? 'ENDED' : 'ACTIVE'}
                </div>
              </div>
            </div>
          </div>

          {gradeResult && (
            <div style={{ ...styles.section, ...styles.gradePanel }}>
              <div style={styles.gradeHeader}>
                <h2 style={{ ...styles.sectionTitle, margin: 0 }}>Grading Result</h2>
                <button
                  onClick={() => setGradeResult(null)}
                  style={{ ...styles.btn, ...styles.btnSmall, ...styles.btnSecondary }}
                >
                  Clear
                </button>
              </div>
              <div style={styles.gradeBody}>{renderGradeRows(gradeResult)}</div>
            </div>
          )}
        </div>

        {/* Right side - Main content */}
        <div style={styles.rightPanel}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>System Metrics</h2>
            <MetricsDisplay state={state} />
          </div>

          <div style={styles.section}>
            <ActionButtons
              actions={actions}
              onAction={handleAction}
              disabled={!state || episodeDone}
              loading={loading}
            />
          </div>

          <div style={styles.section}>
            <HistoryLog entries={history} />
          </div>

        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  dashboard: {
    minHeight: '100vh',
    backgroundColor: 'transparent',
    color: '#e5e7eb',
    fontFamily:
      '"Trebuchet MS", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
  },
  header: {
    background: 'linear-gradient(165deg, rgba(13, 21, 39, 0.92), rgba(8, 15, 31, 0.9))',
    borderBottom: '1px solid rgba(96, 145, 194, 0.24)',
    padding: '24px 32px',
    backdropFilter: 'blur(6px)',
    boxShadow: '0 0 0 1px rgba(88, 136, 186, 0.08), 0 16px 34px rgba(3, 7, 18, 0.62)',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#9ec8f0',
    textShadow: '0 0 12px rgba(93, 157, 214, 0.22)',
  },
  subtitle: {
    margin: '4px 0 12px 0',
    fontSize: '14px',
    color: '#8ea6c1',
  },
  headerStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '12px',
    flexWrap: 'wrap',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
  projectSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  currentSession: {
    fontSize: '12px',
    padding: '4px 8px',
    backgroundColor: 'rgba(8, 15, 30, 0.82)',
    borderRadius: '4px',
    border: '1px solid rgba(94, 138, 188, 0.28)',
  },
  code: {
    fontFamily: 'monospace',
    color: '#9dc4e8',
    marginLeft: '4px',
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: 'linear-gradient(165deg, rgba(13, 21, 39, 0.96), rgba(8, 15, 31, 0.95))',
    borderRadius: '8px',
    border: '1px solid rgba(97, 150, 208, 0.24)',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 22px 52px rgba(3, 7, 18, 0.74)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(82, 120, 160, 0.28)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#8aa4c0',
    fontSize: '20px',
    cursor: 'pointer',
    padding: 0,
  },
  projectList: {
    padding: '12px',
  },
  projectItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    marginBottom: '8px',
    backgroundColor: 'rgba(7, 15, 30, 0.88)',
    borderRadius: '6px',
    border: '1px solid rgba(94, 138, 188, 0.28)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  projectItemActive: {
    backgroundColor: 'rgba(23, 39, 74, 0.72)',
    borderColor: '#8eafd4',
    boxShadow: '0 0 0 1px rgba(124, 165, 209, 0.18), 0 0 14px rgba(80, 110, 148, 0.2)',
  },
  projectItemInfo: {
    flex: 1,
  },
  projectItemId: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#9ec1e6',
    marginBottom: '4px',
  },
  projectItemMeta: {
    fontSize: '11px',
    color: '#8ea6c1',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px',
  },
  emptyText: {
    textAlign: 'center' as const,
    color: '#8ea6c1',
    padding: '20px',
    margin: 0,
  },
  errorBanner: {
    padding: '12px 32px',
    backgroundColor: 'rgba(97, 37, 53, 0.86)',
    color: '#e2b7c0',
    borderBottom: '1px solid rgba(142, 72, 91, 0.8)',
    fontSize: '14px',
  },
  main: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '18px',
    padding: '24px 32px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  section: {
    padding: '20px',
    background: 'linear-gradient(165deg, rgba(13, 21, 39, 0.9), rgba(8, 15, 31, 0.9))',
    backdropFilter: 'blur(6px)',
    borderRadius: '8px',
    border: '1px solid rgba(97, 150, 208, 0.22)',
    boxShadow: '0 0 0 1px rgba(88, 136, 186, 0.08), 0 14px 30px rgba(3, 7, 18, 0.6)',
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#b2c3d8',
  },
  gradeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    gap: '10px',
  },
  gradePanel: {
    minHeight: '260px',
  },
  gradeBody: {
    maxHeight: '360px',
    overflowY: 'auto',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: 'rgba(4, 14, 32, 0.94)',
    border: '1px solid rgba(91, 139, 190, 0.35)',
  },
  gradeGroup: {
    marginBottom: '12px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(86, 122, 160, 0.25)',
  },
  gradeGroupTitle: {
    fontSize: '12px',
    color: '#9ec1e6',
    fontWeight: 700,
    marginBottom: '8px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  gradeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '6px 0',
    borderBottom: '1px dashed rgba(82, 116, 154, 0.2)',
  },
  gradeKey: {
    color: '#8ea6c1',
    fontSize: '12px',
  },
  gradeValue: {
    color: '#c8d8ea',
    fontSize: '12px',
    fontWeight: 600,
    textAlign: 'right',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: 'rgba(4, 14, 32, 0.94)',
    color: '#c8d8ea',
    border: '1px solid rgba(91, 139, 190, 0.35)',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  btn: {
    width: '100%',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '8px',
  },
  btnSmall: {
    width: 'auto',
    padding: '8px 12px',
    fontSize: '12px',
    marginBottom: 0,
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #253b77, #352f67)',
    color: '#c8d7e8',
    border: '1px solid rgba(92, 133, 183, 0.4)',
    boxShadow: 'inset 0 0 12px rgba(129, 173, 222, 0.12), 0 0 14px rgba(53, 78, 141, 0.25)',
  },
  btnSecondary: {
    backgroundColor: 'rgba(36, 49, 74, 0.82)',
    color: '#c7d8ed',
    border: '1px solid rgba(94, 138, 188, 0.3)',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  statBox: {
    backgroundColor: 'rgba(7, 15, 30, 0.86)',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid rgba(94, 138, 188, 0.28)',
  },
  statLabel: {
    color: '#7f95ae',
    fontSize: '12px',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#86bfd8',
  },
};

export default Dashboard;
